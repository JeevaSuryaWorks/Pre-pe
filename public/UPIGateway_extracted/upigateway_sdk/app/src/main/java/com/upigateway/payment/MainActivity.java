package com.upigateway.payment;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.widget.Toast;

public class MainActivity extends AppCompatActivity {
    WebView mWebView;
    Context context;
    String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        if (0 != (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE)) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        context = this;
        mWebView = (WebView) findViewById(R.id.payment_webview);
        initWebView();

        // 👍 Call the Create Order API from your server and you will get the Payment URL.
        //    you will also get UPI intent if you are using Enterprise Plan.
        //    you can use upi intent in payment url and it will directly ask for UPI App.
        // 🚫 Do not Call UPIGateway API in Android App Directly
        String PAYMENT_URL = "https://merchant.upigateway.com/gateway/pay/xxxxxxxxxxxxxxxx";
//        String PAYMENT_URL = "upi://pay?pa=...";

        if (PAYMENT_URL.startsWith("upi:")) {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(Uri.parse(PAYMENT_URL));
            startActivity(intent);
        }else{
            mWebView.loadUrl(PAYMENT_URL);
        }
    }

    @SuppressLint({ "SetJavaScriptEnabled" })
    private void initWebView() {
        mWebView.getSettings().setJavaScriptEnabled(true);
        mWebView.getSettings().setLoadWithOverviewMode(true);
        mWebView.getSettings().setSupportMultipleWindows(true);
        // Do not change Useragent otherwise it will not work. even if not working uncommit below
        // mWebView.getSettings().setUserAgentString("Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.135 Mobile Safari/537.36");
        mWebView.setWebChromeClient(new WebChromeClient());
        mWebView.addJavascriptInterface(new WebviewInterface(), "Interface");
    }

    public class WebviewInterface {
        @JavascriptInterface
        public void paymentResponse(String client_txn_id, String txn_id) {
            Log.i(TAG, client_txn_id);
            Log.i(TAG, txn_id);
            // this function is called when payment is done (success, scanning ,timeout or cancel by user).
            // You must call the check order status API in server and get update about payment.
            // 🚫 Do not Call UpiGateway API in Android App Directly.
            Toast.makeText(context, "Order ID: "+client_txn_id+", Txn ID: "+txn_id, Toast.LENGTH_SHORT).show();
            // Close the Webview.
        }

        @JavascriptInterface
        public void errorResponse() {
            // this function is called when Transaction in Already Done or Any other Issue.
            Toast.makeText(context, "Transaction Error.", Toast.LENGTH_SHORT).show();
            // Close the Webview.
        }
    }

}