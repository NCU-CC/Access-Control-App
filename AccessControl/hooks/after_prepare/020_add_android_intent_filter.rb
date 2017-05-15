#!/usr/bin/env ruby

TARGET = "
        </activity>
"
# please specify hostname in <hostname>
INTENT_FILTER = %(
            <intent-filter android:label="OAuth for Access Control">
                <action android:name="android.intent.action.VIEW" />
                <data android:host="<hostname>" android:scheme="ac" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.nfc.action.NDEF_DISCOVERED" />
                <data android:mimeType="text/entity/id" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>
)
FILENAME = "platforms/android/AndroidManifest.xml"

data = File.read(FILENAME)
if not data.include? INTENT_FILTER
	data[TARGET] = INTENT_FILTER
end

File.open(FILENAME, 'w') do |f|
	f << data
end

