import { copy, readFile } from '@ionic/utils-fs';
import { join } from 'path';
import tempy from 'tempy';

import { Context, loadContext } from '../../src/ctx';
import { AndroidXmlOperation, Operation } from '../../src/definitions';
import Op from '../../src/operations/android/xml';
import { makeOp } from '../utils';

describe('op: android.xml', () => {
  let dir: string;
  let ctx: Context;

  beforeEach(async () => {
    dir = tempy.directory();

    await copy('../common/test/fixtures/ios-and-android', dir);

    ctx = await loadContext(dir);
    ctx.args.quiet = true;
  });

  it('should delete attributes', async () => {
    const op: AndroidXmlOperation = makeOp('android', 'xml', [
      {
        file: 'app/src/main/AndroidManifest.xml',
        target: '//activity',
        deleteAttributes: [
          'android:launchMode'
        ]
      },
    ]);

    await Op(ctx, op as Operation);

    await ctx.project.commit();

    const file = await readFile(join(dir, 'android/app/src/main/AndroidManifest.xml'), { encoding: 'utf-8' });
    //console.log(file);
    expect(file.trim()).toBe(`
<?xml version="1.0" encoding="utf-8" ?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="io.ionic.starter">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <meta-data android:name="com.google.android.geo.API_KEY" android:value="\${MAPS_API_KEY}" />

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name="io.ionic.starter.MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
    `.trim());
  });

  it('should delete nodes', async () => {
    const op: AndroidXmlOperation = makeOp('android', 'xml', [
      {
        file: 'app/src/main/AndroidManifest.xml',
        delete: '//intent-filter'
      },
    ]);

    await Op(ctx, op as Operation);

    await ctx.project.commit();

    const file = await readFile(join(dir, 'android/app/src/main/AndroidManifest.xml'), { encoding: 'utf-8' });
    //console.log(file);
    expect(file.trim()).toBe(`
<?xml version="1.0" encoding="utf-8" ?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="io.ionic.starter">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <meta-data android:name="com.google.android.geo.API_KEY" android:value="\${MAPS_API_KEY}" />

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name="io.ionic.starter.MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
        />

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
    `.trim());
  });

  // per https://github.com/ionic-team/trapeze/issues/87
  it('should merge nodes', async () => {
    const op: AndroidXmlOperation = makeOp('android', 'xml', [
      {
        resFile: 'values/strings.xml',
        target: 'resources',
        merge: `
          <string name="app_name">$PRODUCT_NAME</string>
          <string name="title_activity_main">$PRODUCT_NAME</string>
          <string name="package_name">$ANDROID_PACKAGE_NAME</string>
          <string name="custom_url_scheme">$ANDROID_PACKAGE_NAME</string>
        `
      },
    ]);

    await Op(ctx, op as Operation);

    await ctx.project.commit();

    const file = await readFile(join(dir, 'android/app/src/main/res/values/strings.xml'), { encoding: 'utf-8' });
    //console.log(file);
    expect(file.trim()).toBe(`
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">capacitor-configure-test</string>
    <string name="title_activity_main">capacitor-configure-test</string>
    <string name="package_name">io.ionic.starter</string>
    <string name="custom_url_scheme">io.ionic.starter</string>
    <string name="app_name">$PRODUCT_NAME</string>
    <string name="title_activity_main">$PRODUCT_NAME</string>
    <string name="package_name">$ANDROID_PACKAGE_NAME</string>
    <string name="custom_url_scheme">$ANDROID_PACKAGE_NAME</string>
</resources>
    `.trim());
  });

  it('should replace nodes', async () => {
    const op: AndroidXmlOperation = makeOp('android', 'xml', [
      {
        resFile: 'values/strings.xml',
        target: 'resources/string[@name="app_name"]',
        replace: `
          <string name="app_name">$PRODUCT_NAME</string>
        `
      },
    ]);

    await Op(ctx, op as Operation);

    await ctx.project.commit();

    const file = await readFile(join(dir, 'android/app/src/main/res/values/strings.xml'), { encoding: 'utf-8' });
    //console.log(file);
    expect(file.trim()).toBe(`
<?xml version='1.0' encoding='utf-8' ?>
<resources>
    <string name="app_name">$PRODUCT_NAME</string>
    <string name="title_activity_main">capacitor-configure-test</string>
    <string name="package_name">io.ionic.starter</string>
    <string name="custom_url_scheme">io.ionic.starter</string>
</resources>`.trim());
  });
});
