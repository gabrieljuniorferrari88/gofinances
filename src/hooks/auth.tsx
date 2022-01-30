import React, { 
  createContext, 
  ReactNode, 
  useContext,
  useEffect,
  useState,
} from 'react';

const { CLIENT_ID } = process.env;
const { REDIRECT_URI } = process.env;

import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthProviderProps{
  children: ReactNode;
}

interface User{
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface IAuthContextData{
  user: User;
  signInWithGoogle(): Promise<void>;
  signInWithApple(): Promise<void>;
  signOut(): Promise<void>;
	userStorageIsLoading: boolean;
}

interface AuthorizationResponse {
  params: {
    access_token: string;
  };
  type: string;
}

const AuthContext = createContext({} as IAuthContextData);

function AuthProvider({children}: AuthProviderProps){
  const [user, setUser] = useState<User>({} as User);
	const userStorageKey = '@gofinances:user';
  const [userStorageIsLoading, setUserStorageIsLoading] = useState(true);

  async function signInWithGoogle() {
    try {
      const CLIENT_ID = '219771485577-jpau68u3nmqgmtott631o195oqks6s2n.apps.googleusercontent.com';
      const REDIRECT_URI = 'https://auth.expo.io/@gabrielferrari/gofinances';
      const RESPONSE_TYPE = 'token';
      const SCOPE = encodeURI('profile email');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;

     const {type, params} = await AuthSession
     .startAsync({ authUrl }) as AuthorizationResponse;

     if (type === 'success') {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${params.access_token}`);
      const userInfo = await response.json();

       const name = userInfo.name
       const photo = `https://ui-avatars.com/api/?name=${name}&length=1&bold=true&background=ffffff`

      const userLogged = {
        id: userInfo.id,
        email: userInfo.email,
        name,
        photo: userInfo.picture ?? photo
      }

      setUser(userLogged);
      await AsyncStorage.setItem(userStorageKey, JSON.stringify(userLogged))

      setUser({
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        photo: userInfo.picture,
      });

      setUser(userLogged)
     }
    

    } catch (error) {
      throw new Error(error);
      
    }
  }
  
  async function signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      })

      if (credential) {
				const name = credential.fullName!.givenName!;
				const photo = `https://ui-avatars.com/api/?background=000&color=fff&name=${name}&length=1`
        const userLogged = {
          id: String(credential.user),
          email: credential.email!,
          name,
					photo,
        }

        setUser(userLogged);
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(userLogged));
      }
    } catch (error) {
      throw new Error(error);
    }
  }

	async function signOut(){
		setUser({} as User);
		await AsyncStorage.removeItem(userStorageKey);
	}

	useEffect(()=> {
		async function loadUserStorageDate() {
			const userStoraged = await AsyncStorage.getItem(userStorageKey);

			if(userStoraged){
				const userLogged = JSON.parse(userStoraged) as User;
				setUser(userLogged);
			}
			setUserStorageIsLoading(false);
		}
		loadUserStorageDate();
	},[]);

 
  return (
    <AuthContext.Provider value={{ 
      user, 
      signInWithGoogle ,
      signInWithApple,
			signOut,
			userStorageIsLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth(){
  const context = useContext(AuthContext);

  return context;
}

export { AuthProvider, useAuth }