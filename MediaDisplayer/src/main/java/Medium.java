import javafx.scene.image.Image;
import javafx.scene.media.Media;

import java.net.URI;

public class Medium {
    public Image Image = null;
    public Media Video = null;
    public Utils.FileType Type = Utils.FileType.UNKNOWN;
    public int ShowTime = 0;

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
}
