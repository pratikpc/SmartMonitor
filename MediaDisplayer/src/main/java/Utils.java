import javafx.application.Platform;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Optional;

public class Utils {
    public static void CreateDirectoryIfNotExists(String path) {
        File directory = new File(path);
        if (!directory.exists()) directory.mkdirs();
    }

    public static void ClearDirectory(String fileOrDirectory) {
        ClearDirectory(new File(fileOrDirectory));
    }

    public static void ClearDirectory(File fileOrDirectory) {
        if (fileOrDirectory.isDirectory())
            for (File child : fileOrDirectory.listFiles())
                ClearDirectory(child);

        fileOrDirectory.delete();
    }

    public static boolean CreateConfirmationDialog(final String title, final String content) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle(title);
        //       alert.setHeaderText("Header");
        alert.setContentText(content);

        Optional<ButtonType> result = alert.showAndWait();
        return result.orElse(ButtonType.CANCEL) == ButtonType.OK;
    }

    public static void Terminate() {
        Platform.exit();
        System.exit(0);

    }

    public static String ToUri(final String path) throws Exception{
        return new File(path).toURI().toURL().toExternalForm();
    }

    public static FileType GetFileType(String path) throws Exception {
        final String mimeType = Files.probeContentType(Paths.get(path));
        System.out.println(mimeType);
        if (mimeType == null) return FileType.UNKNOWN;
        if (mimeType.startsWith("image")) return FileType.IMAGE;
        if (mimeType.startsWith("video")) return FileType.VIDEO;
        return FileType.UNKNOWN;
    }

    public enum FileType {
        UNKNOWN,
        IMAGE,
        VIDEO
    }
}
