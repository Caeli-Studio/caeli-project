import { useRouter } from 'expo-router'; // ✅ import du routeur Expo
import * as React from 'react';
import { type TextInput, View } from 'react-native';

import { SocialConnections } from '@/components/social-connections';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';

export function SignInForm() {
  const passwordInputRef = React.useRef<TextInput>(null);
  const router = useRouter(); // ✅ hook pour naviguer

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  function onSubmit() {
    // 🔥 Navigation vers la page home
    router.push('/home');
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">
            Sign in to your app
          </CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome back! Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            {/* Champ email */}
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                submitBehavior="submit"
              />
            </View>

            {/* Champ mot de passe */}
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="web:h-fit ml-auto h-4 px-1 py-0 sm:h-4"
                  onPress={() => {
                    // TODO: Navigate to forgot password screen
                  }}
                >
                  <Text className="font-normal leading-4">
                    Forgot your password?
                  </Text>
                </Button>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
              />
            </View>

            {/* Bouton de connexion */}
            <Button className="w-full" onPress={onSubmit}>
              <Text>Continue</Text>
            </Button>
          </View>

          {/* Lien d'inscription */}
          <Text className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Text className="text-sm underline underline-offset-4 text-blue-500">
              Sign up
            </Text>
          </Text>

          {/* Séparateur */}
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">or</Text>
            <Separator className="flex-1" />
          </View>

          {/* Connexions sociales */}
          <SocialConnections />
        </CardContent>
      </Card>
    </View>
  );
}
