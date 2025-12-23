#include <stdlib.h>
#include <stdio.h>

int needComma = 0;

void pushKey(char *key) {
    if (needComma) printf(",");
    needComma = 0;
    printf("\"%s\":", key);
}

void pushObject() {
    if (needComma) printf(",");
    printf("{");
    needComma = 0;
}

void pushArray() {
    if (needComma) printf(",");
    printf("[");
    needComma = 0;
}

void popObject() {
    printf("}");
    needComma = 1;
}

void popArray() {
    printf("]");
    needComma = 1;
}

void pushString(char *string) {
    if (needComma) printf(",");
    printf("\"%s\"", string);
    needComma = 1;
}

void pushNumber(int number) {
    if (needComma) printf(",");
    printf("%d", number);
    needComma = 1;
}

long long randomState = 420;

int randomNumber(int low, int high) {
    randomState = (randomState * 3163947LL) % 1000000009LL;
    return low + randomState % (high - low);
}

void pushProblem(char *name) {
    pushObject();
    pushKey("name");
    pushString(name);
    pushKey("testingEntries");
    pushArray();
}

void pushTestcase() {
    pushObject();
    pushKey("startingCondition");
    pushObject();
}

void pushAnswer() {
    popObject();
    pushKey("result");
    pushObject();
}

void popTestcase() {
    popObject();
    popObject();
}

void popProblem() {
    popArray();
    popObject();
}

void pushKeyValue(int key, int value) {
    if (needComma) printf(",");
    printf("\"%d\":%d", key, value);
    needComma = 1;
}

int main() {
    pushObject();
    pushKey("problems");
    pushArray();

    pushProblem("1");
    for (int i = 0; i < 10; i++) {
        pushTestcase();
            int a = randomNumber(0, 100);
            int b = randomNumber(0, 100);
            pushKey("0"); pushNumber(a);
            pushKey("1"); pushNumber(b);
        pushAnswer();
            pushKey("10");
            if (a > b) pushNumber(a);
            else pushNumber(b);
        popTestcase();
    }
    popProblem();

    pushProblem("2");
    for (int i = 0; i < 10; i++) {
        pushTestcase();
            int from = randomNumber(5, 50);
            int to = randomNumber(5, 50);
            int number = randomNumber(0, 1000);
            pushKey("0"); pushNumber(from);
            pushKey("1"); pushNumber(to);
            pushKeyValue(from, number);
        pushAnswer();
            pushKeyValue(to, number);
        popTestcase();
    }
    popProblem();

    pushProblem("3");
    for (int i = 0; i < 5; i++) {
        pushTestcase();
            int n = randomNumber(1, 50);
            int bound = randomNumber(1, 1000);
            int max = 0;
            pushKey("0"); pushNumber(n);
            for (int j = 10; j < n + 10; j++) {
                int current = randomNumber(0, bound);
                pushKeyValue(j, current);
                if (current > max) max = current;
            }
        pushAnswer();
            pushKey("9"); pushNumber(max);
        popTestcase();
    }
    popProblem();

    pushProblem("4");
    for (int i = 0; i < 5; i++) {
        pushTestcase();
            int n = randomNumber(1, 50);
            pushKey("0"); pushNumber(n);
        pushAnswer();
            for (int j = 0; j < n; j++) {
                pushKeyValue(j + 10, j + 1);
            }
        popTestcase();
    }
    popProblem();

    pushProblem("5");
    int *numbers = (int*)malloc(40 * sizeof(int));
    for (int i = 0; i < 5; i++) {
        pushTestcase();
            int n = randomNumber(1, 40);
            pushKey("0"); pushNumber(n);
            for (int j = 0; j < n; j++) {
                numbers[j] = randomNumber(0, 1000);
                pushKeyValue(10 + j, numbers[j]);
            }
        pushAnswer();
            for (int j = 0; j < n; j++) {
                pushKeyValue(50 + j, numbers[j]);
            }
        popTestcase();
    }
    popProblem();

    popArray();
    popObject();
}