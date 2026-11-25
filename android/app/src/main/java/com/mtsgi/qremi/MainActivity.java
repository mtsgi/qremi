package com.mtsgi.qremi;

import android.graphics.Color;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import com.getcapacitor.BridgeActivity;

/**
 * QremiのAndroidメインアクティビティ。
 * BridgeActivityのNoActionBarテーマ適用後にEdge-to-Edge表示を有効化する。
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // setTheme(AppTheme_NoActionBar)より前にDecorViewを初期化するとActionBarが表示されるため、super.onCreate後に設定する。
        SystemBarStyle lightBar = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT);
        EdgeToEdge.enable(this, lightBar, lightBar);
    }
}
