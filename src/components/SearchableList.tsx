import React,{useState} from 'react';
import {View,TextInput,FlatList,ListRenderItem,RefreshControl,StyleSheet} from 'react-native';
import EmptyState from './EmptyState';
import {theme} from '../config/theme';
interface Props<T extends {id:string}>{items:T[];getSearchText:(item:T)=>string;renderItem:ListRenderItem<T>;placeholder?:string;refreshing?:boolean;onRefresh?:()=>void;}
export default function SearchableList<T extends {id:string}>({items,getSearchText,renderItem,placeholder='Search…',refreshing=false,onRefresh}:Props<T>){
  const [search,setSearch]=useState('');
  return <View style={styles.container}><TextInput accessibilityLabel={placeholder} placeholder={placeholder} value={search} onChangeText={setSearch} style={styles.search}/><FlatList data={items.filter(item=>getSearchText(item).toLowerCase().includes(search.trim().toLowerCase()))} renderItem={renderItem} keyExtractor={item=>item.id} keyboardShouldPersistTaps="handled" refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>:undefined} ListEmptyComponent={<EmptyState title="No matching results"/>}/></View>;
}
const styles=StyleSheet.create({container:{flex:1},search:{height:48,marginBottom:12,paddingHorizontal:16,borderWidth:1,borderColor:theme.colors.border,borderRadius:12,backgroundColor:'white'}});
