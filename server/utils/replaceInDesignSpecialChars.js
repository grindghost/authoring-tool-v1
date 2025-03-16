const inDesignSpecialCharsCode = {
    "1396927554": "<br>", // COLUMN_BREAK
    "1397125698": "<br>", // FRAME_BREAK
    "1397778242": "<br>", // PAGE_BREAK
    "1397715010": "<br>", // ODD_PAGE_BREAK
    "1397059650": "<br>", // EVEN_PAGE_BREAK
    "1399221837": "[Footnote]", // FOOTNOTE_SYMBOL
    "1399616101": "[LTR Embed]", // LEFT_TO_RIGHT_EMBEDDING
    "1400007781": "[RTL Embed]", // RIGHT_TO_LEFT_EMBEDDING
    "1399874662": "[Pop Dir Formatting]", // POP_DIRECTIONAL_FORMATTING
    "1399616111": "[LTR Override]", // LEFT_TO_RIGHT_OVERRIDE
    "1400007791": "[RTL Override]", // RIGHT_TO_LEFT_OVERRIDE
    "1399092323": "◌", // DOTTED_CIRCLE
    "1400534890": "", // ZERO_WIDTH_JOINER (remove)
    "1397781622": "[Text Variable]", // TEXT_VARIABLE
    "1397969777": "'", // SINGLE_STRAIGHT_QUOTE
    "1396986737": '"', // DOUBLE_STRAIGHT_QUOTE
    "1397777484": "<br>", // DISCRETIONARY_LINE_BREAK
    "1397780074": "", // ZERO_WIDTH_NONJOINER (remove)
    "1398040659": " ", // THIRD_SPACE
    "1397847379": " ", // QUARTER_SPACE
    "1397975379": " ", // SIXTH_SPACE
    "1399746146": " ", // FIXED_WIDTH_NONBREAKING_SPACE
    "1397252717": "-", // HEBREW_MAQAF
    "1397253989": "׳", // HEBREW_GERESH
    "1397254003": "״", // HEBREW_GERSHAYIM
    "1396798059": "ـ", // ARABIC_KASHIDA
    "1396798051": "،", // ARABIC_COMMA
    "1396798307": "؛", // ARABIC_SEMICOLON
    "1396797805": "؟", // ARABIC_QUESTION_MARK
    "1399616109": "[LTR Mark]", // LEFT_TO_RIGHT_MARK
    "1400007789": "[RTL Mark]", // RIGHT_TO_LEFT_MARK
    "1397252723": "׃", // HEBREW_SOF_PASUK
    "1397124194": "<br>", // FORCED_LINE_BREAK
    "1396862068": "•", // BULLET
    "1397969521": "'", // APOSTROPHE
};

export function replaceInDesignSpecialChars(storeData) {
    for (const key in storeData) {
        if (storeData.hasOwnProperty(key)) {
            let value = storeData[key];

            // Replace each special character code in the value
            for (const [code, replacement] of Object.entries(inDesignSpecialCharsCode)) {
                const regex = new RegExp(code, "g"); // Create regex for global replacement
                value = value.replace(regex, replacement);
            }

            // Update the object with the cleaned value
            storeData[key] = value;
        }
    }
}