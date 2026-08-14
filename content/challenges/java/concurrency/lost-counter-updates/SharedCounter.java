import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

final class SharedCounter {
    private int value = 0;

    void increment() {
        value++;
    }

    int value() {
        return value;
    }

    public static void main(String[] args) throws InterruptedException {
        var counter = new SharedCounter();
        var pool = Executors.newFixedThreadPool(4);

        for (int index = 0; index < 100_000; index++) {
            pool.submit(counter::increment);
        }

        pool.shutdown();
        pool.awaitTermination(10, TimeUnit.SECONDS);
        System.out.println(counter.value());
    }
}
