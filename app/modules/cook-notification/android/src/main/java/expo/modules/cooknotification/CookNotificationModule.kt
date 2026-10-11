package expo.modules.cooknotification

import android.app.PendingIntent
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Android's running notification for a cook timer: it stays in the shade and
// on the lock screen, and the system counts its clock down with the app
// closed. expo-notifications can pin a notification but not make it count.
class CookNotificationModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("CookNotification")

    // Shows the notification for one timer, or replaces the one it has.
    Function("show") { id: String, title: String, text: String, detail: String, endAt: Double, channelName: String ->
      val manager = NotificationManagerCompat.from(context)
      // No sound of its own: the timer's alerts make the sound. Not the
      // "silent" level though, which Android keeps off the lock screen.
      manager.createNotificationChannel(
        NotificationChannelCompat.Builder(CHANNEL, NotificationManagerCompat.IMPORTANCE_DEFAULT)
          .setName(channelName)
          .setSound(null, null)
          .setVibrationEnabled(false)
          .build()
      )
      val builder = NotificationCompat.Builder(context, CHANNEL)
        .setSmallIcon(context.applicationInfo.icon)
        .setColor(0xFFC2562E.toInt())
        .setContentTitle(title)
        .setContentText(text)
        .setWhen(endAt.toLong())
        .setShowWhen(true)
        .setUsesChronometer(true)
        .setChronometerCountDown(true)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setCategory(NotificationCompat.CATEGORY_PROGRESS)
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        // It leaves by itself at the end, when the done alert arrives.
        .setTimeoutAfter(maxOf(1L, endAt.toLong() - System.currentTimeMillis()))
      if (detail.isNotEmpty()) {
        builder.setStyle(NotificationCompat.BigTextStyle().bigText("$text\n$detail"))
      }
      context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
        builder.setContentIntent(
          PendingIntent.getActivity(
            context, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
          )
        )
      }
      try {
        manager.notify(id, NOTIFICATION, builder.build())
      } catch (_: SecurityException) {
        // Notifications are not allowed: nothing to show.
      }
    }

    Function("hide") { id: String ->
      NotificationManagerCompat.from(context).cancel(id, NOTIFICATION)
    }
  }

  companion object {
    private const val CHANNEL = "cook-timer-running"
    private const val NOTIFICATION = 1
  }
}
