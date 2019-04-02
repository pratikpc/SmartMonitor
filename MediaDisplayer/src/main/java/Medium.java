import javafx.scene.image.Image;
import javafx.scene.media.Media;

import java.net.URI;
import java.util.concurrent.TimeUnit;

public class Medium {
    public Image Image;
    public Media Video;
    public Utils.FileType Type;

    Medium(final String path) throws Exception {
        this.Type = Utils.GetFileType(new URI(path));
        switch (this.Type) {
            case IMAGE:
                this.Image = new Image(path);
                break;
            case VIDEO:
                this.Video = new Media(path);
                break;
        }
    }

    // TIme for Which to Show Image
    public long TImeInMillisForWhichToShowMedium() {
        switch (this.Type) {
            case VIDEO:
                return (long) this.Video.getDuration().toMillis();
            case IMAGE:
                // 3 Seconds
                return TimeUnit.SECONDS.toMillis(3);
        }
        return (long) (Double.NaN);
    }

    public void DelayTillMediumShowDone() throws Exception {
        TimeUnit.MILLISECONDS.sleep(TImeInMillisForWhichToShowMedium());
    }
}
