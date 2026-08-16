import java.util.List;

record User(String name, boolean active) {}

final class ActiveUsers {
    static List<String> namesOf(List<User> users) {
        return users.stream()
            .filter(User::active)
            .map(User::name)
            .toList();
    }
}
