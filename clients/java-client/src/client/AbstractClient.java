package client;

import java.io.IOException;

public abstract class AbstractClient implements CommandReactor {
    private CommandReactor reactor;

    public AbstractClient(CommandReactor reactor) {
        this.reactor = reactor;
    }

    public abstract void start(String name, String hub) throws IOException, InterruptedException;

    @Override
    public void onWarning(String warning) {
        reactor.onWarning(warning);
    }

    @Override
    public void onInit(GameOptions options, Landscape[][] map) {
        reactor.onInit(options, map);
    }

    @Override
    public void onTurn(GameObject[] info, Turn turn) {
        reactor.onTurn(info, turn);
    }

    @Override
    public void onFinish(int winnerId) {
        reactor.onFinish(winnerId);
        afterFinish();
    }

    protected abstract void afterFinish();
}
