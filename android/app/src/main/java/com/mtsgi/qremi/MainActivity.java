package com.mtsgi.qremi;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

/**
 * QremiのAndroidメインアクティビティ。
 * Capacitor 8のSystemBars設定と組み合わせてEdge-to-Edge表示を有効化する。
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
