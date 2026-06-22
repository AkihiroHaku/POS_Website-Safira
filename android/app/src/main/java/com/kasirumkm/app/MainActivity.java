package com.kasirumkm.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorcommunitysqlite.CapacitorSQLitePlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(CapacitorSQLitePlugin.class);
    super.onCreate(savedInstanceState);
  }
}
