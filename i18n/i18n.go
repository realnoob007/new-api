package i18n

import (
    "encoding/json"
    "io/ioutil"
    "log"
    "os"
    "path/filepath"

    "github.com/gin-gonic/gin"
)

var errorMessages map[string]map[string]string

func init() {
    errorMessages = make(map[string]map[string]string)
    loadErrorMessages("en")
    loadErrorMessages("zh")
}

func loadErrorMessages(lang string) {
    filePath := filepath.Join("i18n", lang+".json")
    file, err := os.Open(filePath)
    if err != nil {
        log.Fatalf("Failed to open %s: %v", filePath, err)
    }
    defer file.Close()

    byteValue, err := ioutil.ReadAll(file)
    if err != nil {
        log.Fatalf("Failed to read %s: %v", filePath, err)
    }

    var messages map[string]string
    if err := json.Unmarshal(byteValue, &messages); err != nil {
        log.Fatalf("Failed to unmarshal %s: %v", filePath, err)
    }

    errorMessages[lang] = messages
}

// GetErrorMessage returns the error message based on the code and preferred language
func GetErrorMessage(code, lang string) string {
    if messages, ok := errorMessages[lang]; ok {
        if message, ok := messages[code]; ok {
            return message
        }
        // Default to English if the message is not found
        return errorMessages["en"][code]
    }
    return "Unknown error"
}

// GetPreferredLanguage returns the preferred language from the request header
func GetPreferredLanguage(c *gin.Context) string {
    lang := c.GetHeader("Accept-Language")
    if lang == "" {
        return "en"
    }
    if len(lang) >= 2 && lang[:2] == "zh" {
        return "zh"
    }
    return "en"
}
