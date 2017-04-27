import java.nio.charset.*;
import java.nio.file.*;
import java.io.*;

import javax.script.*;

import jdk.nashorn.api.scripting.NashornScriptEngineFactory;

public class NashornVue {

  static String readFile(String path, Charset encoding) throws IOException {
    byte[] encoded = Files.readAllBytes(Paths.get(path));
    return new String(encoded, encoding);
  }

  public static void main(String[]args) throws Exception {
      ScriptEngineManager factory = new ScriptEngineManager();
      // Used for jdk8u05 and Java7: ScriptEngine engine = factory.getEngineByName("JavaScript");
      ScriptEngine engine = new NashornScriptEngineFactory().getScriptEngine(new String[] {"-ot=true -strict -fv -doe=false"});

      Bindings bindings = new SimpleBindings();
      //bindings.put("console", new Console());
      System.out.println("Loading vue-nashorn.js");
      executeJs("../packages/vue-server-renderer-nashorn/vue-nashorn.js",engine, bindings);
      System.out.println("Loading benchmarks");
      executeJs("../benchmarks/nashorn/benchmark-nashorn-string-stream.js",engine, bindings);
      System.out.println("done");
  }

  private static void executeJs(String fileName, ScriptEngine engine, Bindings bindings) throws Exception {
    String test = readFile(fileName, StandardCharsets.UTF_8);
    engine.put(ScriptEngine.FILENAME, fileName);
    engine.eval(test, bindings);
  }

}
