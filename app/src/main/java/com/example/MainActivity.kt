package com.example

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : ComponentActivity() {

  private lateinit var webView: WebView
  private var customView: View? = null
  private var customViewCallback: WebChromeClient.CustomViewCallback? = null
  private lateinit var fullscreenContainer: FrameLayout

  private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

  private val fileChooserLauncher =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
      if (fileUploadCallback == null) return@registerForActivityResult
      val data = result.data
      var results: Array<Uri>? = null
      if (result.resultCode == RESULT_OK && data != null) {
        val dataString = data.dataString
        val clipData = data.clipData
        if (clipData != null) {
          results = Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
        } else if (dataString != null) {
          results = arrayOf(Uri.parse(dataString))
        }
      }
      fileUploadCallback?.onReceiveValue(results)
      fileUploadCallback = null
    }

  @SuppressLint("SetJavaScriptEnabled")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Configuration plein écran immersif et barre de statut sombre
    WindowCompat.setDecorFitsSystemWindows(window, false)
    window.statusBarColor = Color.parseColor("#0C0D12")
    window.navigationBarColor = Color.parseColor("#0C0D12")

    val insetsController = WindowCompat.getInsetsController(window, window.decorView)
    insetsController.isAppearanceLightStatusBars = false
    insetsController.isAppearanceLightNavigationBars = false

    val rootLayout = FrameLayout(this).apply {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
      setBackgroundColor(Color.parseColor("#0C0D12"))
    }

    fullscreenContainer = FrameLayout(this).apply {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
      visibility = View.GONE
      setBackgroundColor(Color.BLACK)
    }

    webView = WebView(this).apply {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
      setBackgroundColor(Color.parseColor("#0C0D12"))
    }

    setupWebViewSettings(webView.settings)

    webView.webViewClient = object : WebViewClient() {
      override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url?.toString() ?: return false
        if (url.startsWith("file:///android_asset/vidozone/")) {
          return false
        }
        return try {
          val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
          startActivity(intent)
          true
        } catch (e: Exception) {
          false
        }
      }
    }

    webView.webChromeClient = object : WebChromeClient() {
      override fun onShowFileChooser(
        webView: WebView?,
        filePathCallback: ValueCallback<Array<Uri>>?,
        fileChooserParams: FileChooserParams?
      ): Boolean {
        fileUploadCallback?.onReceiveValue(null)
        fileUploadCallback = filePathCallback

        val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
          type = "*/*"
          addCategory(Intent.CATEGORY_OPENABLE)
        }

        try {
          fileChooserLauncher.launch(intent)
        } catch (e: Exception) {
          fileUploadCallback = null
          return false
        }
        return true
      }

      override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
        if (customView != null) {
          callback?.onCustomViewHidden()
          return
        }
        customView = view
        customViewCallback = callback
        fullscreenContainer.addView(view)
        fullscreenContainer.visibility = View.VISIBLE
        webView.visibility = View.GONE

        WindowCompat.getInsetsController(window, window.decorView).hide(WindowInsetsCompat.Type.systemBars())
      }

      override fun onHideCustomView() {
        if (customView == null) return
        fullscreenContainer.visibility = View.GONE
        fullscreenContainer.removeView(customView)
        customView = null
        customViewCallback?.onCustomViewHidden()
        webView.visibility = View.VISIBLE

        WindowCompat.getInsetsController(window, window.decorView).show(WindowInsetsCompat.Type.systemBars())
      }
    }

    rootLayout.addView(webView)
    rootLayout.addView(fullscreenContainer)
    setContentView(rootLayout)

    // Chargement de l'application VidoZone
    webView.loadUrl("file:///android_asset/vidozone/index.html")

    // Gestion du retour Android
    onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        if (customView != null) {
          webView.webChromeClient?.onHideCustomView()
        } else if (webView.canGoBack()) {
          webView.goBack()
        } else {
          isEnabled = false
          onBackPressedDispatcher.onBackPressed()
        }
      }
    })
  }

  @SuppressLint("SetJavaScriptEnabled")
  private fun setupWebViewSettings(settings: WebSettings) {
    settings.javaScriptEnabled = true
    settings.domStorageEnabled = true
    settings.databaseEnabled = true
    settings.allowFileAccess = true
    settings.allowContentAccess = true
    settings.mediaPlaybackRequiresUserGesture = false
    settings.useWideViewPort = true
    settings.loadWithOverviewMode = true
    settings.displayZoomControls = false
    settings.builtInZoomControls = false
    settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
    settings.cacheMode = WebSettings.LOAD_DEFAULT
  }

  override fun onResume() {
    super.onResume()
    webView.onResume()
  }

  override fun onPause() {
    webView.onPause()
    super.onPause()
  }

  override fun onDestroy() {
    webView.destroy()
    super.onDestroy()
  }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
  Text(text = "Hello $name!", modifier = modifier)
}
