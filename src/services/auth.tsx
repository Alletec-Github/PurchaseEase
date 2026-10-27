import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appConfig } from '../config/appConfig';
import { bcApi } from './bcApi';
import type { UserProfile } from '../types/app';
const AUTH_KEY='@PurchaseEase:isLoggedIn';
const USER_KEY='@PurchaseEase:user';
interface AuthState { user:UserProfile|null; loading:boolean; signIn:(username:string,password:string)=>Promise<void>; signOut:()=>Promise<void>; }
const AuthContext=createContext<AuthState|null>(null);
export function AuthProvider({children}:{children:React.ReactNode}) {
  const [user,setUser]=useState<UserProfile|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;AsyncStorage.multiGet([AUTH_KEY,USER_KEY]).then(values=>{
    const saved=values[1][1];if(values[0][1]==='true'&&saved){const profile=JSON.parse(saved) as UserProfile;
      if(active&&profile.username===appConfig.demoUsername&&profile.isLoggedIn)setUser(profile);}
  }).catch(()=>{ /* A missing or invalid saved session returns to login. */ }).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  const signIn=async(username:string,password:string)=>{
    if(username.trim()!==appConfig.demoUsername||password!==appConfig.demoPassword)throw new Error('Invalid username or password. Please try again.');
    const profile:UserProfile={username:username.trim(),displayName:username.trim(),isLoggedIn:true,loginTimestamp:Date.now()};
    await AsyncStorage.multiSet([[AUTH_KEY,'true'],[USER_KEY,JSON.stringify(profile)]]);setUser(profile);
  };
  const signOut=async()=>{await AsyncStorage.multiRemove([AUTH_KEY,USER_KEY]);bcApi.clearCache();setUser(null);};
  return <AuthContext.Provider value={{user,loading,signIn,signOut}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('AuthProvider is missing');return value;}
