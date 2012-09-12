package client;

import java.io.*;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CommandLineClient extends AbstractClient {

    private String executable;
    private ExecutorService executor;
    private Process process;

    public CommandLineClient(CommandReactor reactor, String executable, ExecutorService executor) {
        super(reactor);
        this.executable = executable;
        this.executor = executor;
    }

    public CommandLineClient(CommandReactor reactor, String executable) {
        super(reactor);
        this.executable = executable;
        this.executor = Executors.newSingleThreadExecutor();
    }

    public void start(String name) throws IOException, InterruptedException {
        process = Runtime.getRuntime().exec(executable);
        InputStream inputStream = process.getInputStream();
        OutputStream outputStream = process.getOutputStream();
        executor.execute(new StreamClient(inputStream, outputStream, this, name));
        process.waitFor();
        BufferedReader br = new BufferedReader(new InputStreamReader(process.getErrorStream()));
        String str;
        while ((str = br.readLine()) != null) {
            System.err.println(str);
        }
        executor.shutdown();
    }


    @Override
    protected void afterFinish() {
        process.destroy();
    }
}
