import javafx.scene.image.Image;
import javafx.scene.media.Media;

import java.net.URI;
import java.util.concurrent.TimeUnit;

public class Medium {
    public Image Image;
    public Media Video;
    public Utils.FileType Type;
    public int ShowTime;

    Medium(final String path, final int showTime) throws Exception {
        this.Type = Utils.GetFileType(new URI(path));
        switch (this.Type) {
            case IMAGE:
                this.Image = new Image(path);
                break;
            case VIDEO:
                this.Video = new Media(path);
                break;
        }
        this.ShowTime = showTime;
    }

    // TIme for Which to Show Medium
    // ShowTimeSeconds only works for Image
    public long TImeInMillisForWhichToShowMedium() {
        switch (this.Type) {
            case VIDEO:
                return (long) this.Video.getDuration().toMillis();
            case IMAGE:
                if (this.ShowTime == 0)
                    // 3 Seconds
                    return TimeUnit.SECONDS.toMillis(3);
                else
                    return TimeUnit.SECONDS.toMillis(this.ShowTime);
        }
        return (long) (Double.NaN);
    }

    public void DelayTillMediumShowDone() throws Exception {
        TimeUnit.MILLISECONDS.sleep(TImeInMillisForWhichToShowMedium());
    }
}
