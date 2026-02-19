package `in`.pinepe.pinepe.mantra

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MantraModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private var mantraPromise: Promise? = null

    companion object {
        private const val MANTRA_REQUEST_CODE = 1111
        private const val TAG = "MANTRA"
    }

    private val activityEventListener = object : ActivityEventListener {

        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            Log.d(TAG, "== onActivityResult ==")

            if (requestCode == MANTRA_REQUEST_CODE && mantraPromise != null) {
                try {
                    if (resultCode == Activity.RESULT_OK && data != null) {
                        val pidData = data.getStringExtra("PID_DATA")

                        if (!pidData.isNullOrEmpty()) {
                            Log.d(TAG, "== PID DATA RECEIVED ==")
                            mantraPromise?.resolve(pidData)
                        } else {
                            Log.e(TAG, "== PID DATA EMPTY ==")
                            mantraPromise?.reject("NO_DATA", "PID_DATA not received")
                        }

                    } else {
                        Log.d(TAG, "== MANTRA CANCELLED ==")
                        mantraPromise?.reject("CANCELLED", "Fingerprint scan cancelled")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "== MANTRA ERROR ==", e)
                    mantraPromise?.reject("ERROR", e.message, e)
                } finally {
                    mantraPromise = null
                }
            }
        }

        override fun onNewIntent(intent: Intent) {
            // Not used
        }
    }

    init {
        Log.d(TAG, "== MANTRA MODULE INITIALIZED ==")
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = "MantraRD"

   @ReactMethod
fun captureFingerprint(wadh: String?, promise: Promise) { // Add wadh parameter

    if (mantraPromise != null) {
        promise.reject("IN_PROGRESS", "Fingerprint scan already in progress")
        return
    }

    val activity = reactContext.currentActivity
    if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity is null")
        return
    }

    mantraPromise = promise

    // Construct PidOptions with wadh if provided
    val wadhAttr = if (!wadh.isNullOrEmpty()) " wadh=\"$wadh\"" else ""
    
  val pidOptions = """<?xml version="1.0" encoding="UTF-8"?>
<PidOptions ver="1.0">
    <Opts fCount="1" fType="2" iCount="0" pCount="0" format="0" pidVer="2.0" timeout="10000" env="P" wadh="$wadh"/>
    <Uses fName="true" fType="2"/>
</PidOptions>""".trimIndent()

    val intent = Intent("in.gov.uidai.rdservice.fp.CAPTURE").apply {
        putExtra("PID_OPTIONS", pidOptions)
    }

    Log.d(TAG, "== LAUNCHING MANTRA RD SERVICE WITH WADH: $wadh ==")
    activity.startActivityForResult(intent, MANTRA_REQUEST_CODE)
}
}
