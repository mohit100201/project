package `in`.pinepe.pinepe.paysprint

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.*
import org.json.JSONObject

class PaysprintModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private var paysprintPromise: Promise? = null

    companion object {
        private const val TAG = "PAYSPRINT_NATIVE"
        private const val PAYSPRINT_REQUEST_CODE = 1111
    }

    private val activityEventListener = object : ActivityEventListener {

        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            Log.d(TAG, "onActivityResult called")
            Log.d(TAG, "requestCode=$requestCode resultCode=$resultCode data=$data")

            if (requestCode == PAYSPRINT_REQUEST_CODE && paysprintPromise != null) {
                try {
                    if (resultCode == Activity.RESULT_OK && data != null) {

                        val status = data.getBooleanExtra("status", false)
                        val response = data.getIntExtra("response", 0)
                        val message = data.getStringExtra("message")

                        Log.d(TAG, "SDK Result → status=$status response=$response message=$message")

                        val result = JSONObject().apply {
                            put("status", status)
                            put("response", response)
                            put("message", message)
                        }

                        Log.d(TAG, "Resolving promise with: $result")
                        paysprintPromise?.resolve(result.toString())

                    } else {
                        Log.w(TAG, "Paysprint cancelled or failed")
                        paysprintPromise?.reject(
                            "CANCELLED",
                            "Paysprint cancelled by user"
                        )
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Paysprint exception", e)
                    paysprintPromise?.reject("ERROR", e.message, e)
                } finally {
                    Log.d(TAG, "Clearing promise reference")
                    paysprintPromise = null
                }
            }
        }

        override fun onNewIntent(intent: Intent) {
            Log.d(TAG, "onNewIntent called: $intent")
        }
    }

    init {
        Log.d(TAG, "PaysprintModule initialized")
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = "PaysprintModule"

    @ReactMethod
    fun startPaysprint(
        pId: String,
        pApiKey: String,
        mCode: String,
        mobile: String,
        lat: String,
        lng: String,
        pipe: String,
        firm: String,
        email: String,
        promise: Promise
    ) {
        Log.d(TAG, "startPaysprint called")
        Log.d(TAG, """
            Params:
            pId=$pId
            mCode=$mCode
            mobile=$mobile
            lat=$lat
            lng=$lng
            pipe=$pipe
            firm=$firm
            email=$email
        """.trimIndent())

        if (paysprintPromise != null) {
            Log.w(TAG, "Paysprint already running")
            promise.reject("IN_PROGRESS", "Paysprint already running")
            return
        }

        val activity = reactContext.currentActivity
        if (activity == null) {
            Log.e(TAG, "Current activity is null")
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        paysprintPromise = promise

        val intent = Intent().apply {
            setClassName(
                activity,
                "com.paysprint.onboardinglib.activities.HostActivity"
            )

            putExtra("pId", pId)
            putExtra("pApiKey", pApiKey)
            putExtra("mCode", mCode)
            putExtra("mobile", mobile)
            putExtra("lat", lat)
            putExtra("lng", lng)
            putExtra("pipe", pipe)
            putExtra("firm", firm)
            putExtra("email", email)

            addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
        }

        Log.d(TAG, "Launching Paysprint HostActivity")
        activity.startActivityForResult(intent, PAYSPRINT_REQUEST_CODE)
    }
}