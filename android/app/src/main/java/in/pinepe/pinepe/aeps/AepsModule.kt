package `in`.pinepe.pinepe.aeps

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.util.Log
import com.aeps.aepslib.newCode.AepsActivity
import com.aeps.aepslib.ICICIEKYCActivity
import com.aeps.aepslib.NsdlOnBoardingActivity
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.random.Random

class AepsModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private var aepsPromise: Promise? = null

    companion object {
        private const val AEPS_TXN_REQUEST_CODE = 300
        private const val ICICI_EKYC_REQUEST_CODE = 400
        private const val TAG = "AEPS"
    }

    /* -------------------- Activity Result Listener -------------------- */

    private val activityEventListener = object : ActivityEventListener {

        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            Log.d(TAG, "onActivityResult called requestCode=$requestCode resultCode=$resultCode")

            if (aepsPromise == null) {
                Log.w(TAG, "Promise is null, ignoring result")
                return
            }

            try {
                // Handle different request codes
                when (requestCode) {
                    AEPS_TXN_REQUEST_CODE -> handleAepsTransactionResult(activity, resultCode, data)
                    ICICI_EKYC_REQUEST_CODE -> handleIciciEkycResult(activity, resultCode, data)
                    else -> {
                        Log.w(TAG, "Unknown request code: $requestCode")
                        aepsPromise?.reject("UNKNOWN", "Unknown request code")
                        aepsPromise = null
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing activity result", e)
                aepsPromise?.reject("ERROR", e.message, e)
                aepsPromise = null
            }
        }

        override fun onNewIntent(intent: Intent) {
            Log.d(TAG, "onNewIntent called (ignored)")
        }
    }

    init {
        Log.d(TAG, "AepsModule initialized")
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = "AepsModule"

    /* -------------------- Case 1: ICICI EKYC (startActivityForResult with code 400) -------------------- */

    @ReactMethod
    fun startIciciEkyc(
        agentId: String,
        developerId: String,
        password: String,
        mobile: String,
        aadhaar: String,
        email: String,
        pan: String,
        promise: Promise
    ) {
        Log.d(TAG, "startIciciEkyc called from JS")

        if (aepsPromise != null) {
            Log.w(TAG, "AEPS already running")
            promise.reject("IN_PROGRESS", "AEPS already running")
            return
        }

        val activity = reactContext.currentActivity
        if (activity == null) {
            Log.e(TAG, "Current activity is NULL")
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        aepsPromise = promise

        try {
            val intent = Intent(activity, ICICIEKYCActivity::class.java).apply {
                putExtra("agent_id", agentId)
                putExtra("developer_id", developerId)
                putExtra("password", password)
                putExtra("rnfi_onboarding_flag", "0")
                putExtra("icici_flag", "0")
                putExtra("mobile", mobile)
                putExtra("aadhaar", aadhaar)
                putExtra("email", email)
                putExtra("pan", pan)
                putExtra("bankVendorType", "ICICI")
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }

            Log.d(TAG, "Launching ICICIEKYCActivity with request code 400")
            activity.startActivityForResult(intent, ICICI_EKYC_REQUEST_CODE)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error launching ICICI EKYC", e)
            aepsPromise?.reject("LAUNCH_ERROR", "Failed to launch ICICI EKYC: ${e.message}")
            aepsPromise = null
        }
    }

    /* -------------------- Case 2: NSDL Onboarding (startActivity - no result expected) -------------------- */

    @ReactMethod
    fun startNsdlOnboarding(
        agentId: String,
        developerId: String,
        password: String,
        promise: Promise
    ) {
        Log.d(TAG, "startNsdlOnboarding called from JS")

        val activity = reactContext.currentActivity
        if (activity == null) {
            Log.e(TAG, "Current activity is NULL")
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        try {
            val intent = Intent(activity, NsdlOnBoardingActivity::class.java).apply {
                putExtra("agent_id", agentId)
                putExtra("developer_id", developerId)
                putExtra("password", password)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }

            Log.d(TAG, "Launching NsdlOnBoardingActivity with startActivity (no result expected)")
            activity.startActivity(intent)
            
            // Resolve immediately since no result is expected
            val result = JSONObject().apply {
                put("status", "SUCCESS")
                put("message", "NSDL Onboarding launched successfully")
            }
            promise.resolve(result.toString())
            
        } catch (e: Exception) {
            Log.e(TAG, "Error launching NSDL onboarding", e)
            promise.reject("LAUNCH_ERROR", "Failed to launch NSDL onboarding: ${e.message}")
        }
    }

    /* -------------------- Case 3: AEPS Transaction (startActivityForResult with code 300) -------------------- */

    @ReactMethod
    fun startAepsTransaction(
        agentId: String,
        developerId: String,
        password: String,
        bankVendorType: String,
        promise: Promise
    ) {
        Log.d(TAG, "startAepsTransaction called from JS")

        if (aepsPromise != null) {
            Log.w(TAG, "AEPS already running")
            promise.reject("IN_PROGRESS", "AEPS already running")
            return
        }

        val activity = reactContext.currentActivity
        if (activity == null) {
            Log.e(TAG, "Current activity is NULL")
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        aepsPromise = promise

        val transactionId = createMultipleTransactionID()
        Log.d(TAG, "Generated Transaction ID: $transactionId")

        try {
            val intent = Intent(activity, AepsActivity::class.java).apply {
                putExtra("agent_id", agentId)
                putExtra("developer_id", developerId)
                putExtra("password", password)
                putExtra("bankVendorType", bankVendorType)
                putExtra("clientTransactionId", transactionId)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }

            Log.d(TAG, "Launching AepsActivity with request code 300")
            activity.startActivityForResult(intent, AEPS_TXN_REQUEST_CODE)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error launching AEPS transaction", e)
            aepsPromise?.reject("LAUNCH_ERROR", "Failed to launch AEPS: ${e.message}")
            aepsPromise = null
        }
    }

    /* -------------------- Result Handlers -------------------- */

    private fun handleAepsTransactionResult(activity: Activity, resultCode: Int, data: Intent?) {
        try {
            if (resultCode != Activity.RESULT_OK) {
                val message = data?.getStringExtra("message") ?: "AEPS transaction cancelled"
                val statusCode = data?.getStringExtra("statusCode") ?: "CANCELLED"
                val dataJson = data?.getStringExtra("data") ?: "{}"

                val dataObj = try {
                    JSONObject(dataJson)
                } catch (e: Exception) {
                    JSONObject()
                }

                val result = JSONObject().apply {
                    put("statusCode", statusCode)
                    put("message", message)
                    put("data", dataObj)
                }

                aepsPromise?.resolve(result.toString())
                aepsPromise = null
                return
            }

            if (data == null) {
                aepsPromise?.reject("CANCELLED", "AEPS transaction cancelled")
                aepsPromise = null
                return
            }

            val message = data.getStringExtra("message") ?: ""
            val statusCode = data.getStringExtra("statusCode") ?: ""
            val dataJson = data.getStringExtra("data") ?: "{}"

            Log.d(TAG, "AEPS Transaction Result → message=$message status=$statusCode data=$dataJson")

            val dataObj = try {
                JSONObject(dataJson)
            } catch (e: Exception) {
                JSONObject().apply { put("raw", dataJson) }
            }

            // Show transaction details dialog
            try {
                if (!activity.isFinishing) {
                    val builderMessage = StringBuilder().apply {
                        append(message)
                        append("\nBank: ${dataObj.optString("bankName")}")
                        append("\nRRN: ${dataObj.optString("bankrefrenceNo")}")
                        append("\nService: ${dataObj.optString("service")}")
                        append("\nSTAN: ${dataObj.optString("stanNo")}")
                        append("\nAmount: ₹${dataObj.optString("transactionAmount")}")
                        append("\nTxn ID: ${dataObj.optString("transactionId")}")
                        append("\nTxn No: ${dataObj.optString("transactionNO")}")
                        append("\nUID: ${dataObj.optString("uidNo")}")
                    }.toString()

                    showAlertDialog(activity, "AEPS Transaction Result", builderMessage)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to show dialog", e)
            }

            val result = JSONObject().apply {
                put("message", message)
                put("statusCode", statusCode)
                put("data", dataObj)
            }

            aepsPromise?.resolve(result.toString())

        } catch (e: Exception) {
            Log.e(TAG, "Error handling AEPS transaction result", e)
            aepsPromise?.reject("ERROR", e.message, e)
        } finally {
            aepsPromise = null
        }
    }

    private fun handleIciciEkycResult(activity: Activity, resultCode: Int, data: Intent?) {
        try {
            val message = data?.getStringExtra("message") ?: "ICICI EKYC completed"
            val statusCode = data?.getStringExtra("statusCode") ?: "SUCCESS"
            
            val result = JSONObject().apply {
                put("message", message)
                put("statusCode", statusCode)
                put("requestCode", ICICI_EKYC_REQUEST_CODE)
            }

            // Show result dialog
            if (!activity.isFinishing) {
                showAlertDialog(activity, "ICICI EKYC Result", message)
            }

            aepsPromise?.resolve(result.toString())

        } catch (e: Exception) {
            Log.e(TAG, "Error handling ICICI EKYC result", e)
            aepsPromise?.reject("ERROR", e.message, e)
        } finally {
            aepsPromise = null
        }
    }

    /* -------------------- Alert Dialog -------------------- */

    private fun showAlertDialog(activity: Activity, title: String, message: String) {
        activity.runOnUiThread {
            AlertDialog.Builder(activity)
                .setTitle(title)
                .setMessage(message)
                .setCancelable(false)
                .setPositiveButton("OK") { dialog, _ ->
                    dialog.dismiss()
                }
                .show()
        }
    }

    /* -------------------- Transaction ID Generator -------------------- */

    private fun createMultipleTransactionID(): String {
        val sdf = SimpleDateFormat("yyMMddHHmmssSS", Locale.US)
        val timePart = sdf.format(Date())
        val randomPart = Random.nextInt(100000, 999999)
        return "$timePart$randomPart"
    }
}