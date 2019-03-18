import javax.swing.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.util.Properties;

public class MainClass {

    static Properties p;
    static PropertiesDeal propertiesDeal = new PropertiesDeal();

    public static void main(final String[] args) throws Exception {

        UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());

        p = propertiesDeal.loadProperties();

        boolean running = true;

        if (!p.containsKey("id")) {
            running = false;
            Signup signUp = new Signup();
            signUp.setVisible(true);
            signUp.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
            signUp.addWindowListener(new WindowAdapter() {
                @Override
                public void windowClosed(WindowEvent e) {
                    super.windowClosed(e);
                    try {
                        p = propertiesDeal.loadProperties();
                        if (p.containsKey("id")) {
                            RunFX(args);
                        }
                    } catch (Exception e1) {
                        e1.printStackTrace();
                    }
                }
            });
        }
        if (running) {
            RunFX(args);
        }
    }

    static void RunFX(String[] args) throws Exception {
        p = propertiesDeal.loadProperties();
        FXMain.launch(FXMain.class, args);
    }
}
