import { cookieOptions } from '@/constants/cookieOptions';
import { Button, Snackbar } from '@mui/material';
import Box from '@mui/material/Box';
import { setCookie } from 'cookies-next';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '@/lib/firebase/firebaseClient';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextFieldRHF } from '../../components/forms/TextFieldRHF';
import { useFirebaseUserContext } from '../../providers/FirebaseUserProvider';
import { getLogin } from '@/apis/auth/getLogin';

const loginFormSchema = z //zod
  .object({
    email: z
      .string()
      .min(1, { message: 'メールアドレスを入力してください' })
      .email({ message: '正しいメールアドレスの形式で入力してください。' }),

    password: z
      .string()
      .min(8, { message: '8桁以上のパスワードを入力してください' })
      .regex(/^[a-zA-Z0-9]+$/, {
        message: '英大文字、英小文字、数字で入力してください',
      }),
  });
type LoginFormSchemaType = z.infer<typeof loginFormSchema>;

export const Login = () => {
  const { setFirebaseUser } = useFirebaseUserContext();
  const {
    //何を使うか
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormSchemaType>({
    //<型>(中身：オブジェクトの形)
    resolver: zodResolver(loginFormSchema),
    mode: 'onSubmit',
    criteriaMode: 'all',
    defaultValues: {
      email: '',
      password: '',
    },
  });
  // console.log(errors);
  const [loginError, setLoginError] = useState('');
  const [isSnackbarErrorOpen, setIsSnackbarErrorOpen] = useState(false);
  const router = useRouter();

  const login = (data: LoginFormSchemaType) => {
    signInWithEmailAndPassword(auth, data.email, data.password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        user
          .getIdToken() //トークン取得
          .then((token) => {
            setCookie('token', token, cookieOptions); //'key', value, options
            getLogin()
              .then(() => {
                setFirebaseUser(user); //ログインの状態を保持
                router.push('/');
              })
              .catch((error) => {
                //サーバー側で発生したエラーをキャッチして、snackbarにエラー文載せて表示
                console.log(error);
                setLoginError(error.response.data.error);
                setIsSnackbarErrorOpen(true);
              });
          });
        // ...
      })
      .catch((error) => {
        if (error instanceof FirebaseError) {
          // 例　{"code":"auth/email-already-in-use","customData":{"appName":"[DEFAULT]","_tokenResponse":{"error":{"code":400,"message":"EMAIL_EXISTS","errors":[{"message":"EMAIL_EXISTS","domain":"global","reason":"invalid"}]}}},"name":"FirebaseError"}
          //エラーがfirebaseに関連したものであれば
          // console.log(JSON.stringify(error));
          if (error.code === 'auth/user-not-found') {
            // do something
            setLoginError('認証に失敗しました。');
          }
        }
      });
  };
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        justifyContent: 'center',
      }}
    >
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isSnackbarErrorOpen}
        onClose={() => setIsSnackbarErrorOpen(false)}
        message={loginError}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '350px',
        }}
      >
        <Box component="h1" sx={{ paddingBottom: '32px', fontSize: '20px' }}>
          {process.env.NEXT_PUBLIC_APP_TITLE}
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit(login)}
          sx={{
            width: '350px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid gray',
            borderRadius: '5px',
            padding: '32px',
            backgroundColor: 'white',
          }}
        >
          <Box component="h4">ログイン</Box>
          <Box>
            {/* ControllerをTextFieldRHFで書き換えて整理する */}
            {/* name等固有のものは残し、共通のものは書き換え。 */}
            <TextFieldRHF<LoginFormSchemaType>
              // <Controller
              control={control}
              name="email"
              label="メールアドレス"
              // render={({ field }) => (
              //   <TextField
              //     ref={field.ref}
              //     name={field.name}
              //     value={field.value}
              //     onChange={field.onChange} // send value to hook form
              //     onBlur={field.onBlur} // notify when input is touched/blur
              //     disabled={field.disabled}

              // variant="standard"
              // fullWidth
              // helperText={errors.email?.message}
              // error={!!errors.email}
              // />
              // )}
            />
            <TextFieldRHF<LoginFormSchemaType>
              control={control}
              name="password"
              label="パスワード"
              type="password"
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            sx={{ width: '200px', marginTop: '16px' }}
          >
            ログイン
          </Button>
        </Box>
        <Box sx={{ display: 'flex', width: '100%' }}>
          <Link
            href="/changePassword"
            style={{ width: '230px', marginTop: '16px', marginLeft: 'auto' }}
          >
            パスワードを忘れた方はこちら
          </Link>
        </Box>
        <Box sx={{ display: 'flex', width: '100%' }}>
          <Link
            href="/register"
            style={{ marginLeft: 'auto', fontSize: 'small', marginTop: '7px' }}
          >
            新規会員登録
          </Link>
        </Box>
      </Box>
    </Box>
  );
};
