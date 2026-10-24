import type { ODataQueryParams } from '../types/api';
import { MockApiError } from './errors';
const invalid = (message='Unsupported filter expression'): never => { throw new MockApiError('INVALID_QUERY',message,400); };
type Token = { kind:'word'|'literal'|'symbol'; value:string|number|boolean };
function tokenize(input:string):Token[] {
  const tokens:Token[]=[];let rest=input.trim();
  while(rest) {
    let match:RegExpMatchArray|null;
    if((match=rest.match(/^'((?:[^']|'')*)'/)))tokens.push({kind:'literal',value:match[1].replace(/''/g,"'")});
    else if((match=rest.match(/^-?\d+(?:\.\d+)?/)))tokens.push({kind:'literal',value:Number(match[0])});
    else if((match=rest.match(/^[A-Za-z_][A-Za-z0-9_]*/)))tokens.push({kind:match[0]==='true'||match[0]==='false'?'literal':'word',value:match[0]==='true'?true:match[0]==='false'?false:match[0]});
    else if((match=rest.match(/^[(),]/)))tokens.push({kind:'symbol',value:match[0]});
    else return invalid();
    rest=rest.slice(match[0].length).trimStart();
  }
  return tokens;
}
function predicate<T extends object>(filter:string, sample:T|undefined):(row:T)=>boolean {
  const tokens=tokenize(filter);let pos=0;
  const take=()=>tokens[pos++]??invalid();
  const expect=(value:string)=>{if(take().value!==value)invalid();};
  const field=()=>{const token=take();if(token.kind!=='word'||(sample&&!(String(token.value) in sample)))invalid('Unknown filter field');return String(token.value) as keyof T;};
  const literal=()=>{const token=take();if(token.kind!=='literal')invalid();return token.value;};
  function atom():(row:T)=>boolean {
    if(tokens[pos]?.value==='('){pos++;const fn=or();expect(')');return fn;}
    if(['contains','startswith','endswith'].includes(String(tokens[pos]?.value))) {
      const op=String(take().value);expect('(');const key=field();expect(',');const value=String(literal()).toLowerCase();expect(')');
      return row=>{const text=String(row[key]).toLowerCase();return op==='contains'?text.includes(value):op==='startswith'?text.startsWith(value):text.endsWith(value);};
    }
    const key=field();const op=take().value;if(!['eq','ne','gt','ge','lt','le'].includes(String(op)))invalid();const value=literal();
    return row=>{const actual=row[key] as string|number|boolean;switch(op){case 'eq':return actual===value;case 'ne':return actual!==value;case 'gt':return actual>value;case 'ge':return actual>=value;case 'lt':return actual<value;case 'le':return actual<=value;default:return false;}};
  }
  function and():(row:T)=>boolean {let result=atom();while(tokens[pos]?.value==='and'){pos++;const left=result,right=atom();result=row=>left(row)&&right(row);}return result;}
  function or():(row:T)=>boolean {let result=and();while(tokens[pos]?.value==='or'){pos++;const left=result,right=and();result=row=>left(row)||right(row);}return result;}
  const result=or();if(pos!==tokens.length)invalid();return result;
}
export function query<T extends object>(rows:T[], params:ODataQueryParams={}):T[] {
  let result=[...rows];const filter=params.$filter??params.filter;const orderby=params.$orderby??params.orderby;
  if(filter)result=result.filter(predicate(filter,rows[0]));
  if(orderby){const clauses=orderby.split(',').map(clause=>{const match=clause.trim().match(/^([A-Za-z_]\w*)(?: (asc|desc))?$/);if(!match)invalid('Invalid sort expression');const key=match![1] as keyof T;if(rows[0]&&!(key in rows[0]))invalid('Unknown sort field');return {key,desc:match![2]==='desc'};});
    result.sort((a,b)=>{for(const {key,desc} of clauses){if(a[key]!==b[key])return (a[key]<b[key]?-1:1)*(desc?-1:1);}return 0;});}
  const top=params.$top??params.top;const skip=params.$skip??0;
  if(!Number.isInteger(skip)||skip<0||top!==undefined&&(!Number.isInteger(top)||top<0))invalid('Pagination must use non-negative integers');
  return result.slice(skip,top===undefined?undefined:skip+top);
}
