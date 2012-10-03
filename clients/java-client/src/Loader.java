import ai.AI;
import client.*;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class Loader {

    public static final int DEFAULT_COUNT = 4;
    private static ExecutorService runner = Executors.newCachedThreadPool();
    
    static class BugAI implements CommandReactor {
        @Override
        public void onWarning(String warning) {}

        @Override
        public void onInit(GameOptions options, Landscape[][] map) {}

        @Override
        public void onTurn(GameObject[] info, Turn turn) {
            throw new RuntimeException("close");
        }

        @Override
        public void onFinish(int winnerId) {}
    }
    
    public static void main(String args[]) throws InterruptedException {
        int count = args.length > 0 ? Integer.parseInt(args[0]) : DEFAULT_COUNT;
        CommandReactor cr = new AI();
        if (count < 0) {
            count = -count;
            cr = new BugAI();
        }
        while (count --> 0) {
            final int finalCount = count;
            final CommandReactor finalCr = cr;
            runner.execute(new Runnable() {
                @Override
                public void run() {
                    SocketClient cl = new SocketClient(
                            finalCr, "localhost", 3002, runner
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
