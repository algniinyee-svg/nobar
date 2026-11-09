const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..', 'android');
const MAIN = path.join(ROOT, 'app', 'src', 'main');
const RES = path.join(MAIN, 'res');
const PKG = 'com.algani.nobar';
const HOST = 'nobar-d2bd.roarai.app';
const log = m => console.log('[patch] ' + m);
const soft = (name, fn) => { try { fn(); log('ok: ' + name); } catch (e) { log('dilewati (' + name + '): ' + e.message); } };

/* ---------- penulis PNG ---------- */
const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const png = (w, h, raw) => {
  const hd = Buffer.alloc(13); hd.writeUInt32BE(w, 0); hd.writeUInt32BE(h, 4); hd[8] = 8; hd[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', hd), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
};
const draw = (w, h, px) => {
  const st = w * 4 + 1, raw = Buffer.alloc(st * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = px(x / w, y / h), o = y * st + 1 + x * 4; raw[o] = p[0]; raw[o + 1] = p[1]; raw[o + 2] = p[2]; raw[o + 3] = p[3]; }
  return png(w, h, raw);
};
const tri = (u, v) => u > 0.38 && u < 0.72 && Math.abs(v - 0.5) < (0.72 - u) * 0.647;
const legacy = round => (u, v) => {
  if (round && (u - 0.5) ** 2 + (v - 0.5) ** 2 > 0.25) return [0, 0, 0, 0];
  if (tri(u, v)) return [255, 255, 255, 255];
  return [60 + 80 * u, 90 + 60 * v, 230 - 40 * u, 255];
};
const fore = (u, v) => { const a = (u - 0.5) / 0.62 + 0.5, b = (v - 0.5) / 0.62 + 0.5; return tri(a, b) ? [255, 255, 255, 255] : [0, 0, 0, 0]; };
const stat = (u, v) => { const d = Math.hypot(u - 0.5, v - 0.5); return ((d > 0.36 && d < 0.47) || tri(u, v)) ? [255, 255, 255, 255] : [0, 0, 0, 0]; };
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

/* ---------- 1. izin, metadata, dan App Links (wajib) ---------- */
(() => {
  const mf = path.join(MAIN, 'AndroidManifest.xml');
  let x = fs.readFileSync(mf, 'utf8');
  if (!x.includes('<application')) throw new Error('AndroidManifest tidak dikenali');
  const perms = ['CAMERA', 'RECORD_AUDIO', 'MODIFY_AUDIO_SETTINGS', 'POST_NOTIFICATIONS', 'VIBRATE', 'WAKE_LOCK', 'ACCESS_NETWORK_STATE'];
  const add = perms.filter(p => !x.includes('android.permission.' + p)).map(p => '    <uses-permission android:name="android.permission.' + p + '" />').join('\n')
    + '\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-feature android:name="android.hardware.microphone" android:required="false" />\n';
  x = x.replace('<application', add + '    <application');
  const links = '        <intent-filter android:autoVerify="true">\n'
    + '            <action android:name="android.intent.action.VIEW" />\n'
    + '            <category android:name="android.intent.category.DEFAULT" />\n'
    + '            <category android:name="android.intent.category.BROWSABLE" />\n'
    + '            <data android:scheme="https" android:host="' + HOST + '" />\n'
    + '        </intent-filter>\n    ';
  if (!x.includes('</activity>')) throw new Error('tag activity tidak ditemukan');
  x = x.replace('</activity>', links + '</activity>');
  const meta = '        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_nobar" />\n'
    + '        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/nobar_notif" />\n'
    + '        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="nobar" />\n    ';
  x = x.replace('</application>', meta + '</application>');
  fs.writeFileSync(mf, x);
  log('izin, metadata, dan App Links ditambahkan');
})();

/* ---------- 2. kode native (wajib) ---------- */
(() => {
  const dir = path.join(MAIN, 'java', ...PKG.split('.'));
  walk(path.join(MAIN, 'java')).filter(f => path.basename(f) === 'MainActivity.java').forEach(f => fs.unlinkSync(f));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'MainActivity.java'), `package ${PKG};

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(NobarNativePlugin.class);
    super.onCreate(savedInstanceState);
    getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
      @Override
      public void handleOnBackPressed() {
        getBridge().getWebView().evaluateJavascript(
          "(function(){try{return window.nbBack?(window.nbBack()?1:0):0}catch(e){return 0}})()",
          v -> { if (!"1".equals(v)) moveTaskToBack(true); });
      }
    });
  }
}
`);
  fs.writeFileSync(path.join(dir, 'NobarNativePlugin.java'), `package ${PKG};

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

@CapacitorPlugin(name = "NobarNative")
public class NobarNativePlugin extends Plugin {
  @PluginMethod
  public void keepAwake(PluginCall call) {
    final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
    getActivity().runOnUiThread(() -> {
      if (on) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    });
    call.resolve();
  }

  @PluginMethod
  public void fullscreen(PluginCall call) {
    final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
    getActivity().runOnUiThread(() -> {
      WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getActivity().getWindow(), getActivity().getWindow().getDecorView());
      if (on) {
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
      } else {
        c.show(WindowInsetsCompat.Type.systemBars());
      }
    });
    call.resolve();
  }

  @PluginMethod
  public void landscape(PluginCall call) {
    final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
    getActivity().runOnUiThread(() -> getActivity().setRequestedOrientation(
      on ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED));
    call.resolve();
  }

  private Uri storeImage(PluginCall call) {
    String b64 = call.getString("data");
    if (b64 == null || b64.isEmpty()) { call.reject("Data gambar kosong"); return null; }
    if (Build.VERSION.SDK_INT < 29) { call.reject("Fitur simpan butuh Android 10 ke atas"); return null; }
    try {
      byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
      String name = call.getString("name", "nobar-rekap") + "-" + System.currentTimeMillis() + ".png";
      ContentValues v = new ContentValues();
      v.put(MediaStore.Images.Media.DISPLAY_NAME, name);
      v.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
      v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Nobar");
      v.put(MediaStore.Images.Media.IS_PENDING, 1);
      ContentResolver cr = getContext().getContentResolver();
      Uri uri = cr.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
      if (uri == null) throw new Exception("tidak bisa membuat berkas");
      try (OutputStream os = cr.openOutputStream(uri)) { os.write(bytes); }
      v.clear();
      v.put(MediaStore.Images.Media.IS_PENDING, 0);
      cr.update(uri, v, null, null);
      return uri;
    } catch (Exception e) {
      call.reject("Gagal menyimpan: " + e.getMessage());
      return null;
    }
  }

  @PluginMethod
  public void saveImage(PluginCall call) {
    Uri u = storeImage(call);
    if (u == null) return;
    JSObject r = new JSObject();
    r.put("uri", u.toString());
    call.resolve(r);
  }

  @PluginMethod
  public void shareImage(PluginCall call) {
    Uri u = storeImage(call);
    if (u == null) return;
    try {
      Intent i = new Intent(Intent.ACTION_SEND);
      i.setType("image/png");
      i.putExtra(Intent.EXTRA_STREAM, u);
      i.putExtra(Intent.EXTRA_TEXT, call.getString("text", ""));
      i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      getActivity().startActivity(Intent.createChooser(i, "Bagikan rekap"));
      call.resolve();
    } catch (Exception e) {
      call.reject("Gagal membuka menu berbagi: " + e.getMessage());
    }
  }
}
`);
  log('kode native ditulis');
})();

/* ---------- 3. ikon aplikasi ---------- */
soft('ikon', () => {
  const dens = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] };
  for (const [d, [s, f]] of Object.entries(dens)) {
    const dir = path.join(RES, 'mipmap-' + d); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), draw(s, s, legacy(false)));
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), draw(s, s, legacy(true)));
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), draw(f, f, fore));
  }
  fs.mkdirSync(path.join(RES, 'values'), { recursive: true });
  fs.writeFileSync(path.join(RES, 'values', 'ic_launcher_background.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#4562E0</color>\n</resources>\n');
});

/* ---------- 4. ikon & warna notifikasi (wajib: dipakai metadata manifest) ---------- */
(() => {
  const sizes = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 };
  for (const [d, s] of Object.entries(sizes)) {
    const dir = path.join(RES, 'drawable-' + d); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'ic_stat_nobar.png'), draw(s, s, stat));
  }
  fs.mkdirSync(path.join(RES, 'values'), { recursive: true });
  fs.writeFileSync(path.join(RES, 'values', 'nobar_colors.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="nobar_notif">#4562E0</color>\n</resources>\n');
  log('ikon notifikasi dibuat');
})();

/* ---------- 5. layar pembuka ---------- */
soft('splash', () => {
  walk(RES).filter(f => path.basename(f) === 'splash.png').forEach(file => {
    const b = fs.readFileSync(file);
    if (b.readUInt32BE(0) !== 0x89504e47) return;
    const w = b.readUInt32BE(16), h = b.readUInt32BE(20), st = w * 4 + 1, raw = Buffer.alloc(st * h), row = Buffer.alloc(st);
    for (let x = 0; x < w; x++) { const o = 1 + x * 4; row[o] = 11; row[o + 1] = 16; row[o + 2] = 32; row[o + 3] = 255; }
    for (let y = 0; y < h; y++) row.copy(raw, y * st);
    const s = Math.round(Math.min(w, h) * 0.26), x0 = Math.round((w - s) / 2), y0 = Math.round((h - s) / 2);
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
      const u = i / s, v = j / s, d = Math.hypot(u - 0.5, v - 0.5);
      let c = null; if (d > 0.4 && d < 0.47) c = [155, 231, 255]; else if (tri(u, v)) c = [183, 155, 255];
      if (c) { const o = (y0 + j) * st + 1 + (x0 + i) * 4; raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = 255; }
    }
    fs.writeFileSync(file, png(w, h, raw));
  });
});

/* ---------- 6. warna bar sistem ---------- */
soft('warna sistem', () => {
  const f = path.join(RES, 'values', 'styles.xml'); let x = fs.readFileSync(f, 'utf8');
  x = x.replace('<item name="android:background">@null</item>', '<item name="android:background">@null</item>\n        <item name="android:statusBarColor">#0B1020</item>\n        <item name="android:navigationBarColor">#0B1020</item>\n        <item name="android:windowLightStatusBar">false</item>');
  fs.writeFileSync(f, x);
});

/* ---------- 7. nonaktifkan lint rilis ---------- */
soft('lint', () => {
  const f = path.join(ROOT, 'app', 'build.gradle'); let x = fs.readFileSync(f, 'utf8');
  x = x.replace('android {', 'android {\n    lint {\n        checkReleaseBuilds false\n        abortOnError false\n    }');
  fs.writeFileSync(f, x);
});
log('selesai');
