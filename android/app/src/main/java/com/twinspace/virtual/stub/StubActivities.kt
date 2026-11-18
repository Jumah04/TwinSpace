package com.twinspace.virtual.stub

/**
 * Stub Activities:
 * Declared in AndroidManifest.xml to satisfy Android's ActivityManagerService (AMS)
 * verification checks when running in different launch modes and process boundaries.
 */

open class StubActivity : TwinContainerActivity() {
    class P0 : StubActivity()
    class P1 : StubActivity()
    class P2 : StubActivity()
}

class StubActivitySingleTop : TwinContainerActivity()

class StubActivitySingleTask : TwinContainerActivity()

class StubActivitySingleInstance : TwinContainerActivity()

class StubDialogActivity : TwinContainerActivity()
