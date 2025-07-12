import { Button } from '@affine/component';
import { SettingHeader } from '@affine/component/setting-components';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';

import { AccountSetting } from '../../desktop/dialogs/setting/account-setting';
import { AppThemeService } from '../theme';
import * as styles from './style.css';

/**
 * A dedicated page for user profile settings.
 * Reuses components from the desktop setting dialogs.
 */
export const UserProfilePage = () => {
  const t = useI18n();
  const appThemeService = useService(AppThemeService);
  const theme = useLiveData(appThemeService.appTheme.theme$);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    appThemeService.appTheme.theme$.next(newTheme);
  };

  return (
    <div className={styles.root}>
      <SettingHeader
        title={t['com.affine.setting.account']()}
        subtitle={t['com.affine.setting.account.message']()}
        data-testid="user-profile-page-header"
      />
      {/* We can reuse the whole AccountSetting component or compose it from parts */}
      <AccountSetting />

      <div style={{ marginTop: '20px' }}>
        <SettingHeader title="Theme Settings" />
        <p>Current theme: {theme}</p>
        <Button onClick={toggleTheme}>Toggle Theme</Button>
      </div>
    </div>
  );
};
