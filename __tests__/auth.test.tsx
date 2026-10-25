import React from 'react';
import TestRenderer,{act} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthProvider,useAuth} from '../src/services/auth';
import {appConfig} from '../src/config/appConfig';
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@react-native-async-storage/async-storage',()=>require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
let auth:ReturnType<typeof useAuth>;
function Harness(){auth=useAuth();return null;}
let tree:TestRenderer.ReactTestRenderer;
async function mount(){await act(async()=>{tree=TestRenderer.create(<AuthProvider><Harness/></AuthProvider>);});}
beforeEach(async()=>{await AsyncStorage.clear();});
afterEach(async()=>{await act(async()=>tree?.unmount());});
test('sign-in updates UI state, restores after remount and sign-out clears the same keys',async()=>{
  await mount();expect(auth.user).toBeNull();
  await act(async()=>{await auth.signIn(appConfig.demoUsername,appConfig.demoPassword);});expect(auth.user?.username).toBe(appConfig.demoUsername);
  await act(async()=>tree.unmount());await mount();expect(auth.user?.isLoggedIn).toBe(true);
  await act(async()=>{await auth.signOut();});expect(auth.user).toBeNull();expect(await AsyncStorage.getItem('@PurchaseEase:isLoggedIn')).toBeNull();expect(await AsyncStorage.getItem('@PurchaseEase:user')).toBeNull();
});
test('incorrect credentials do not persist a session',async()=>{await mount();await expect(auth.signIn('invalid','invalid')).rejects.toThrow('Invalid username');expect(auth.user).toBeNull();});
test('corrupted saved profile returns to login',async()=>{await AsyncStorage.multiSet([['@PurchaseEase:isLoggedIn','true'],['@PurchaseEase:user','bad JSON']]);await mount();expect(auth.loading).toBe(false);expect(auth.user).toBeNull();});
