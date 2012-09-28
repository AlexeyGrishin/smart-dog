import ai.AI;
import client.SocketClient;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class Loader {

    public static final int DEFAULT_COUNT = 40;
    private static ExecutorService runner = Executors.newCachedThreadPool();
    
    public static void main(String args[]) throws InterruptedException {
        int count = args.length > 0 ? Integer.parseInt(args[0]) : DEFAULT_COUNT;
        while (count --> 0) {
            final int finalCount = count;
            runner.execute(new Runnable() {
                @Override
                public void run() {
                    SocketClient cl = new SocketClient(
                            new AI(), "localhost", 3002, runner
                    );
                    try {
                        cl.start("loadbot#" + finalCount, null);
                    } catch (IOException e) {
                        e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
                    } catch (InterruptedException e) {
                        e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
                    }
                }
            });
        }
        Thread.sleep(1000*10);
        runner.shutdown();
        runner.awaitTermination(30, TimeUnit.MINUTES);
    }
}
