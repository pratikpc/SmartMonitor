import javax.swing.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.util.Properties;

public class MainClass {

    static  Properties p;
    static PropertiesDeal propertiesDeal = new PropertiesDeal();
    public static void main(final String[] args) throws Exception {
        p = propertiesDeal.loadProperties();

        boolean running = true;

        if(!p.containsKey("id"))
        {
            running = false;
            Signup signUp = new Signup();
            signUp.setVisible(true);
            signUp.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
            signUp.addWindowListener(new WindowAdapter() {
                @Override
                public void windowClosed(WindowEvent e) {
                    super.windowClosed(e);
                    RunFX(args);
                }
            });
        }
        if(running)
        {
            RunFX(args);
        }
    }

    static void RunFX(String[] args)
    {
        try{
            p = propertiesDeal.loadProperties();
            FXMain.launch(FXMain.class,args);
        }
        catch (Exception ex){ex.printStackTrace();}}
}
