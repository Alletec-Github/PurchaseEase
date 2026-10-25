import React, {useEffect,useState} from 'react';
import {TextInput,TextInputProps} from 'react-native';
interface Props extends Omit<TextInputProps,'value'|'onChangeText'>{value:number;onChangeValue:(value:number)=>void;}
export default function DecimalInput({value,onChangeValue,...props}:Props){
  const [text,setText]=useState(Number.isFinite(value)?String(value):'');
  useEffect(()=>{setText(Number.isFinite(value)?String(value):'');},[value]);
  return <TextInput {...props} keyboardType="decimal-pad" value={text} onChangeText={input=>{
    const normalized=input.replace(',','.');
    if(!/^-?\d*\.?\d*$/.test(normalized))return;
    setText(normalized);onChangeValue(normalized===''||normalized==='-'||normalized==='.'?NaN:Number(normalized));
  }}/>;
}
