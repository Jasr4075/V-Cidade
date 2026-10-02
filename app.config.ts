import type { ExpoConfig } from 'expo/config';
import base from './app.json';

/**
 * Config dinâmico do app.
 *
 * Existe apenas para injetar a chave do Google Maps em builds nativos. A
 * documentação do `react-native-maps` mostra `process.env.X` dentro de
 * `app.json`, mas um JSON estático não é avaliado: a string literal
 * `process.env.GOOGLE_MAPS_API_KEY` iria parar no AndroidManifest e o mapa
 * continuaria preto. O plugin de config precisa receber o valor já resolvido.
 *
 * Sem essas chaves o app ainda funciona no Expo Go — o Expo Go do SDK 55+ é
 * que carrega uma chave do Google Maps expirada e desenha o mapa preto. Para
 * ver os tiles em Android é preciso um development build.
 */
export default (): ExpoConfig => {
  const config = base.expo as ExpoConfig;

  const mapsPlugin: [string, Record<string, string | undefined>] = [
    'react-native-maps',
    {
      androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
    },
  ];

  const plugins = (config.plugins ?? []).filter(
    (plugin) => !(Array.isArray(plugin) && plugin[0] === 'react-native-maps')
  ) as ExpoConfig['plugins'];

  return {
    ...config,
    plugins: [...(plugins ?? []), 'expo-font', mapsPlugin],
  };
};