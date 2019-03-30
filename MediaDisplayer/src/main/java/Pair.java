import javafx.scene.image.Image;
import javafx.scene.media.Media;

public class Pair {
    public Image Image;
    public Media Video;
    public Utils.FileType Type;

    void Add(final String path) throws Exception{
        this.Type = Utils.GetFileType(path);
        Add( Utils.ToUri(path), this.Type);
    }

    void Add(final String path, final Utils.FileType type) {
        switch (type) {
            case IMAGE:
                Image = new Image(path);
                break;
            case VIDEO:
                Video = new Media(path);
                break;
            default:
                break;
        }
    }
    Pair(final String path) throws Exception {
        Add(path);
    }
}
