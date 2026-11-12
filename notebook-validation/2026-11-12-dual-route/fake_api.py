"""Test-only OpenAI-compatible transport. No real key or external HTTP is used."""
import json
from itertools import count
import httpx2
from openai import AsyncOpenAI as OriginalClient
from agents.testing import ModelStep, ScriptedModel
from agents import ModelSettings
from agents.models.interface import ModelTracing
from openai.types.responses import ResponseOutputMessage, ResponseOutputText

BEHAVIOR='tools'
STYLE='responses'
getpass_calls=0
client_constructions=0
requests=[]
ids=count(1)

def fake_getpass(prompt):
    global getpass_calls
    getpass_calls+=1
    return 'fake-key-for-test-only'

def result_text():return 'HTTP接口模拟返回的教学回答，不代表真实模型推理。'

def decide(body, style):
    if style=='responses':
        history=body['input']
        tools=body.get('tools',[])
        names=[t['name'] for t in tools]
        has_result=any(isinstance(i,dict) and i.get('type')=='function_call_output' for i in history)
    else:
        history=body['messages']
        tools=body.get('tools',[])
        names=[t['function']['name'] for t in tools]
        has_result=any(i.get('role')=='tool' for i in history)
    if BEHAVIOR=='direct' or not names or has_result:return None
    name=names[0]
    args={'city':'Shanghai'} if name=='get_weather' else ({'input':'分析天气'} if name=='ask_expert' else ({'order_id':'A123','amount':500} if name=='refund_order' else {}))
    return name,json.dumps(args,ensure_ascii=False)

async def transport(request):
    body=json.loads(request.content)
    style='responses' if request.url.path.endswith('/responses') else 'chat_completions'
    assert request.headers['authorization']=='Bearer fake-key-for-test-only'
    requests.append({'style':style,'stream':bool(body.get('stream')),'body':body})
    if BEHAVIOR=='error':
        return httpx2.Response(429,json={'error':{'message':'Mock quota failure','type':'insufficient_quota','code':'insufficient_quota'}},request=request)
    if body.get('stream'):
        if style=='responses':
            message=ResponseOutputMessage(id='msg_stream',type='message',role='assistant',status='completed',content=[ResponseOutputText(type='output_text',text=result_text(),annotations=[])])
            model=ScriptedModel([ModelStep(output=[message])])
            payload=[]
            async for event in model.stream_response(system_instructions=None,input='stream',model_settings=ModelSettings(),tools=[],output_schema=None,handoffs=[],tracing=ModelTracing.DISABLED,previous_response_id=None,conversation_id=None,prompt=None):
                payload.append('event: '+event.type+'\ndata: '+event.model_dump_json()+'\n\n')
            content=''.join(payload).encode()
        else:
            chunks=[]
            for delta,reason in [({'role':'assistant','content':''},None),({'content':result_text()},None),({},'stop')]:
                chunks.append({'id':'chat_stream','object':'chat.completion.chunk','created':1,'model':'mock-model','choices':[{'index':0,'delta':delta,'finish_reason':reason}]})
            content=(''.join('data: '+json.dumps(c,ensure_ascii=False)+'\n\n' for c in chunks)+'data: [DONE]\n\n').encode()
        return httpx2.Response(200,content=content,headers={'content-type':'text/event-stream'},request=request)
    operation=decide(body,style)
    unique=next(ids)
    if style=='responses':
        output=([{'id':f'fc_{unique}','type':'function_call','call_id':f'call_{unique}','name':operation[0],'arguments':operation[1],'status':'completed'}] if operation else [{'id':f'msg_{unique}','type':'message','role':'assistant','status':'completed','content':[{'type':'output_text','text':result_text(),'annotations':[],'logprobs':[]}]}])
        data={'id':f'resp_{unique}','object':'response','created_at':1,'model':'mock-model','status':'completed','output':output,'usage':{'input_tokens':10,'output_tokens':5,'total_tokens':15,'input_tokens_details':{'cached_tokens':0},'output_tokens_details':{'reasoning_tokens':0}}}
    else:
        message=({'role':'assistant','content':None,'tool_calls':[{'id':f'call_{unique}','type':'function','function':{'name':operation[0],'arguments':operation[1]}}]} if operation else {'role':'assistant','content':result_text()})
        data={'id':f'chat_{unique}','object':'chat.completion','created':1,'model':'mock-model','choices':[{'index':0,'finish_reason':'tool_calls' if operation else 'stop','message':message}],'usage':{'prompt_tokens':10,'completion_tokens':5,'total_tokens':15}}
    return httpx2.Response(200,json=data,request=request)

def factory(**kwargs):
    global client_constructions
    client_constructions+=1
    assert kwargs['api_key']=='fake-key-for-test-only'
    assert kwargs['max_retries']==0
    return OriginalClient(**kwargs,http_client=httpx2.AsyncClient(transport=httpx2.MockTransport(transport)))
