import { dirname, join } from 'path';
import { StorybookConfig } from '@storybook/react-vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import swc from 'unplugin-swc';
import { mergeConfig } from 'vite';

export default {
  stories: ['../src/ui/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],

  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
    '@chromatic-com/storybook',
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },

  features: {},

  docs: {},

  async viteFinal(config, _options) {
    return mergeConfig(config, {
      plugins: [
        vanillaExtractPlugin(),
        swc.vite({
          jsc: {
            preserveAllComments: true,
            parser: {
              syntax: 'typescript',
              dynamicImport: true,
              tsx: true,
              decorators: true,
            },
            target: 'es2022',
            externalHelpers: false,
            transform: {
              react: {
                runtime: 'automatic',
              },
              useDefineForClassFields: false,
              decoratorVersion: '2022-03',
            },
          },
          sourceMaps: true,
          inlineSourcesContent: true,
        }),
      ],
      define: {
        'BUILD_CONFIG.debug': JSON.stringify(true),
        'BUILD_CONFIG.distribution': JSON.stringify('web'),
        'BUILD_CONFIG.isDesktopEdition': JSON.stringify(true),
        'BUILD_CONFIG.isMobileEdition': JSON.stringify(false),
        'BUILD_CONFIG.isElectron': JSON.stringify(false),
        'BUILD_CONFIG.isWeb': JSON.stringify(true),
        'BUILD_CONFIG.isMobileWeb': JSON.stringify(false),
        'BUILD_CONFIG.isIOS': JSON.stringify(false),
        'BUILD_CONFIG.isAndroid': JSON.stringify(false),
        'BUILD_CONFIG.isNative': JSON.stringify(false),
        'BUILD_CONFIG.isAdmin': JSON.stringify(false),
        'BUILD_CONFIG.appBuildType': JSON.stringify('canary'),
        'BUILD_CONFIG.appVersion': JSON.stringify('0.21.0'),
        'BUILD_CONFIG.editorVersion': JSON.stringify('0.21.0'),
        'BUILD_CONFIG.githubUrl': JSON.stringify('https://github.com/toeverything/AFFiNE'),
        'BUILD_CONFIG.changelogUrl': JSON.stringify('https://github.com/toeverything/AFFiNE/releases'),
        'BUILD_CONFIG.downloadUrl': JSON.stringify('https://affine.pro/download'),
        'BUILD_CONFIG.pricingUrl': JSON.stringify('https://affine.pro/pricing'),
        'BUILD_CONFIG.discordUrl': JSON.stringify('https://affine.pro/redirect/discord'),
        'BUILD_CONFIG.requestLicenseUrl': JSON.stringify('https://affine.pro/redirect/license'),
        'BUILD_CONFIG.imageProxyUrl': JSON.stringify('/api/worker/image-proxy'),
        'BUILD_CONFIG.linkPreviewUrl': JSON.stringify('/api/worker/link-preview'),
        'BUILD_CONFIG.CAPTCHA_SITE_KEY': JSON.stringify(''),
        'BUILD_CONFIG.SENTRY_DSN': JSON.stringify(''),
        'BUILD_CONFIG.MIXPANEL_TOKEN': JSON.stringify(''),
        'BUILD_CONFIG.DEBUG_JOTAI': JSON.stringify(''),
      },
    });
  },

  // typescript: {
  //   reactDocgen: 'react-docgen-typescript',
  // },
} satisfies StorybookConfig;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}
