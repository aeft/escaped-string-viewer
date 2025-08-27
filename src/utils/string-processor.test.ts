import { StringProcessor } from './string-processor';

// Simple test framework
class TestRunner {
  private tests: Array<{ name: string; fn: () => void }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => void) {
    this.tests.push({ name, fn });
  }

  run() {
    console.log('Running tests...\n');
    
    for (const test of this.tests) {
      try {
        test.fn();
        this.passed++;
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);
  }

  assertEqual(actual: any, expected: any, message?: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  assertNull(value: any, message?: string) {
    if (value !== null) {
      throw new Error(message || `Expected null, got ${JSON.stringify(value)}`);
    }
  }
}

const runner = new TestRunner();

// Method 2 Test Cases - Extract JSON String
runner.test('Method 2: Single quoted string in text', () => {
  const result = StringProcessor.processSelectedText('The message is "Hello\\nWorld" in the log');
  runner.assertEqual(result?.decoded, 'Hello\nWorld');
  runner.assertEqual(result?.method, 'extract');
});

runner.test('Method 2: Multiple quoted strings - picks longest', () => {
  const result = StringProcessor.processSelectedText('Short "hi" and longer "Hello\\nWorld\\tTest"');
  runner.assertEqual(result?.decoded, 'Hello\nWorld\tTest');
  runner.assertEqual(result?.method, 'extract');
});

runner.test('Method 2: String with escaped quotes', () => {
  const result = StringProcessor.processSelectedText('Error: "File \\"config.json\\" not found"');
  runner.assertEqual(result?.decoded, 'File "config.json" not found');
  runner.assertEqual(result?.method, 'extract');
});

runner.test('Method 2: String with Unicode escapes', () => {
  const result = StringProcessor.processSelectedText('Unicode test "Hello \\u4e16\\u754c" here');
  runner.assertEqual(result?.decoded, 'Hello 世界');
  runner.assertEqual(result?.method, 'extract');
});

runner.test('Method 2: Empty string', () => {
  const result = StringProcessor.processSelectedText('Found empty string ""');
  runner.assertEqual(result?.decoded, '');
  runner.assertEqual(result?.method, 'extract');
});

runner.test('Method 2: Complex nested escapes', () => {
  const result = StringProcessor.processSelectedText('JSON: "Line1\\nTab:\\tQuote:\\"Hi\\"\\nEnd"');
  runner.assertEqual(result?.decoded, 'Line1\nTab:\tQuote:"Hi"\nEnd');
  runner.assertEqual(result?.method, 'extract');
});

runner.test('Method 2: Mixed with code syntax', () => {
  const result = StringProcessor.processSelectedText('console.log("Debug: status=\\\"OK\\\"");');
  runner.assertEqual(result?.decoded, 'Debug: status="OK"');
  runner.assertEqual(result?.method, 'extract');
});

runner.test('Method 2: String in JSON context', () => {
  const result = StringProcessor.processSelectedText('{"message": "Error\\nFile not found", "code": 404}');
  runner.assertEqual(result?.decoded, 'Error\nFile not found');
  runner.assertEqual(result?.method, 'extract');
});

// Edge cases
runner.test('Method 2: No quoted strings', () => {
  const result = StringProcessor.processSelectedText('No quotes here at all');
  runner.assertNull(result);
});

runner.test('Method 2: Single quotes (should fail)', () => {
  const result = StringProcessor.processSelectedText("Single quote 'Hello\\nWorld' test");
  runner.assertNull(result);
});

runner.test('Method 2: Malformed quotes', () => {
  const result = StringProcessor.processSelectedText('Broken "string without end');
  runner.assertNull(result);
});

runner.test('Method 2: Only quote marks', () => {
  const result = StringProcessor.processSelectedText('Just "" quotes');
  runner.assertEqual(result?.decoded, '');
  runner.assertEqual(result?.method, 'extract');
});

// Method 1 Test Cases - Direct JSON Parse
runner.test('Method 1: Simple quoted string', () => {
  const result = StringProcessor.processSelectedText('"Hello\\nWorld"');
  runner.assertEqual(result?.decoded, 'Hello\nWorld');
  runner.assertEqual(result?.method, 'json');
});

runner.test('Method 1: String with tabs and escapes', () => {
  const result = StringProcessor.processSelectedText('"Line1\\nTab:\\tEnd"');
  runner.assertEqual(result?.decoded, 'Line1\nTab:\tEnd');
  runner.assertEqual(result?.method, 'json');
});

runner.test('Method 1: Single quotes should fail', () => {
  const result = StringProcessor.processSelectedText("'Hello\\nWorld'");
  runner.assertNull(result);
});

// Run all tests
runner.run();