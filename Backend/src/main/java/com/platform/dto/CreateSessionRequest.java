package com.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateSessionRequest {

    @NotBlank(message = "Session title is required")
    @Size(min = 3, max = 100, message = "Session title must be between 3 and 100 characters")
    private String title;

    // Constructors
    public CreateSessionRequest() {
    }

    public CreateSessionRequest(String title) {
        this.title = title;
    }

    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
