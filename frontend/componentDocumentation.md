# Component Documentation

## Button (NavButton)

### Props
- `buttonInfo`: { backgroundColor, width, height, color, fontSize, fontWeight, borderRadius, marginHorizontal, marginBottom }
- `onPress`: Function (callback on button press)
- `text`: String (button label)
- `theme`: { background: string; text: string }

### Usage
```tsx
<NavButton
  buttonInfo={buttonInfo}
  onPress={handlePress}
  text="Continue"
  theme={theme}
/>
```

---

## MessageBubble

### Props
- `messageInfo`: { color, fontSize, fontWeight, messageBoxWidth, pointerStatus, messageBoxOutline, messageBoxFill }
- `message`: String (text content)
- `theme`: { background: string; text: string }

### Usage
```tsx
<MessageBubble
  messageInfo={messageInfo}
  message="Hello, how are you?"
  theme={theme}
/>
```

---

## SignalBar

### Props
- `barInfo`: { containerOutlineColor, containerFillColor, barBorderColor, barFillColor, signalWidth, signalHeight }
- `strength`: Number (1–5)
- `theme`: { background: string; text: string }

### Usage
```tsx
<SignalBar
  barInfo={barInfo}
  strength={3}
  theme={theme}
/>
```

---

## OptionBox

### Props
- `optionInfo`: { selectedBoxColor, boxColor, color, optionFillColor, optionOutlineColor, fontSize, fontWeight, keywordFontSize, keywordFontWeight }
- `options`: Array<{ key: string; value: string; keyword?: string; icon?: string }>
- `onSelect`: Function (callback with selected item)
- `theme`: { background: string; text: string }

### Usage
```tsx
<OptionBox
  options={options}
  optionInfo={optionInfo}
  onSelect={(item) => console.log(item)}
  theme={theme}
/>
```
