import React from 'react';
import {View,Text,StyleSheet} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ActionButton from './ActionButton';
import {theme} from '../config/theme';
export default function ErrorState({message,onRetry}:{message:string;onRetry:()=>void}) {
  return <View style={styles.container} accessibilityRole="alert"><Icon name="alert-circle-outline" size={40} color={theme.colors.error}/><Text style={styles.message}>{message}</Text><ActionButton title="Retry" onPress={onRetry}/></View>;
}
const styles=StyleSheet.create({container:{padding:24,alignItems:'center',gap:16},message:{color:theme.colors.textSecondary,textAlign:'center'}});
