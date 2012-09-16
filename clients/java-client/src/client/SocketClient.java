package client;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SocketClient extends AbstractClient {

    private int port;
    private String host;
    private ExecutorService executor;
    private final Object closeEvent = new Object();
    private Socket socket;

    public SocketClient(CommandReactor reactor, String host, int port, ExecutorService executor) {
        super(reactor);
        this.port = port;
        this.host = host;
        this.executor = executor;
    }

    public SocketClient(CommandReactor reactor, String host, int port ) {
        super(reactor);
        this.port = port;
        this.host = host;
        this.executor = Executors.newSingleThreadExecutor();
    }

    @Override
    public void start(final String name) throws IOException, InterruptedException {
        socket = new Socket(this.host, this.port);

        final InputStream inputStream = socket.getInputStream();
        final OutputStream outputStream = socket.getOutputStream();
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    new StreamClient(inputStream, outputStream, SocketClient.this, name).run();
                }
                catch (Throwable e) {
                    if (socket.isClosed()) return;
                    e.printStackTrace();
                    try {
                        socket.close();
                    } catch (IOException e1) {
                        e1.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
                    }
                    afterFinish();
                }
            }
        });
        synchronized (closeEvent) {
            while (!socket.isClosed()) {
                closeEvent.wait();
            }
        }
        executor.shutdown();
    }

    @Override
    protected void afterFinish() {
        if (!socket.isClosed())
            try {
                socket.close();
            } catch (IOException e) {
                e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
            }
        synchronized (closeEvent) {
            closeEvent.notifyAll();
        }
    }
}
