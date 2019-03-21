import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.Properties;

public class PropertiesDeal {
    File file;

    PropertiesDeal() {
        this("props");
    }

    PropertiesDeal(String name) {
        file = new File(name);
    }

    void saveProperties(Properties p) throws Exception {
        FileOutputStream fr = new FileOutputStream(file);
        p.store(fr, "Properties");
        fr.close();
    }

    Properties loadProperties() throws Exception {
        Properties p = new Properties();
        if (!file.exists())
            return p;
        FileInputStream fi = new FileInputStream(file);
        p.load(fi);
        fi.close();
        return p;
    }

    boolean deleteProperties() {
        if (!file.exists())
            return false;
        return file.delete();
    }
}
