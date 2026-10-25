import React,{useState} from 'react';
import TestRenderer,{act} from 'react-test-renderer';
import {TextInput} from 'react-native';
import DecimalInput from '../src/components/DecimalInput';
test('retains a decimal separator while typing and emits decimal numeric values',()=>{
  let amount=0;
  function Harness(){const [value,setValue]=useState(1);return <DecimalInput value={value} onChangeValue={next=>{amount=next;setValue(next);}}/>;}
  let tree:TestRenderer.ReactTestRenderer;
  act(()=>{tree=TestRenderer.create(<Harness/>);});
  const input=()=>tree.root.findByType(TextInput);
  act(()=>input().props.onChangeText('1.'));expect(input().props.value).toBe('1.');
  act(()=>input().props.onChangeText('1.25'));expect(amount).toBe(1.25);expect(input().props.value).toBe('1.25');
  act(()=>input().props.onChangeText(''));expect(Number.isNaN(amount)).toBe(true);
  act(()=>tree.unmount());
});
