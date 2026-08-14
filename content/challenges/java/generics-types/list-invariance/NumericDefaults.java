import java.util.ArrayList;
import java.util.List;

final class NumericDefaults {
    static void addZero(List<Number> values) {
        values.add(0);
    }

    public static void main(String[] args) {
        List<Integer> attempts = new ArrayList<>();
        addZero(attempts);
    }
}
