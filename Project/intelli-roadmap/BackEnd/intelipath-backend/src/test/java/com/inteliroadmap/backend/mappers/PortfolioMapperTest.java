package com.inteliroadmap.backend.mappers;

import com.inteliroadmap.backend.domain.dto.response.portfolio.PortfolioResponse;
import com.inteliroadmap.backend.domain.entity.PortfolioConfig;
import com.inteliroadmap.backend.domain.entity.Student;
import com.inteliroadmap.backend.domain.entity.User;
import com.inteliroadmap.backend.repositories.SkillRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

/**
 * The portfolio is read through three doors — the owner's page, a mentor's page, and the
 * public {@code /p/{slug}} page — and all three read this one mapper. These tests pin the
 * identity defaults here, because they used to be applied in the owner's browser instead,
 * which is what made the public page show a different person than the student saw.
 */
class PortfolioMapperTest {

    private static final String PLACEHOLDER_NAME = "Student Name";

    private final PortfolioMapper mapper = new PortfolioMapper(mock(SkillRepository.class));

    private User user() {
        return User.builder()
                .userId(UUID.randomUUID())
                .fullName("Đặng Phước Vinh")
                .email("vinh@example.com")
                .build();
    }

    private Student student() {
        return Student.builder()
                .userId(UUID.randomUUID())
                .portfolioSlug("vinh")
                .universityName("FPT University")
                .major("Software Engineering")
                .admissionDate(LocalDate.of(2023, 9, 1))
                .build();
    }

    private PortfolioResponse map(PortfolioConfig config, Student student) {
        return mapper.toPortfolioResponse(user(), student, config,
                List.of(), List.of(), List.of(), List.of(), null, null);
    }

    @Test
    void fillsIdentityFromTheAccountWhenTheStudentHasNoConfigYet() {
        Map<String, Object> hero = map(null, student()).getConfig().getHeroSection();

        assertEquals("Đặng Phước Vinh", hero.get("name"));
        assertEquals("Software Engineering", hero.get("role"));
        // Vietnamese names put the given name last, so the greeting is by the last token.
        assertEquals("Hi, I'm Vinh!", hero.get("greeting"));
    }

    @Test
    void treatsTheSeededPlaceholderNameAsNotFilledIn() {
        Map<String, Object> stored = new LinkedHashMap<>();
        stored.put("name", PLACEHOLDER_NAME);

        Map<String, Object> hero = map(
                PortfolioConfig.builder().heroSection(stored).build(), student()).getConfig().getHeroSection();

        assertEquals("Đặng Phước Vinh", hero.get("name"));
    }

    @Test
    void neverOverwritesWhatTheStudentActuallyWrote() {
        Map<String, Object> stored = new LinkedHashMap<>();
        stored.put("name", "Vinh D.");
        stored.put("role", "Backend Developer");
        stored.put("greeting", "Xin chào!");

        Map<String, Object> hero = map(
                PortfolioConfig.builder().heroSection(stored).build(), student()).getConfig().getHeroSection();

        assertEquals("Vinh D.", hero.get("name"));
        assertEquals("Backend Developer", hero.get("role"));
        assertEquals("Xin chào!", hero.get("greeting"));
    }

    @Test
    void showsTheEnrolmentAsEducationUntilTheStudentAddsTheirOwn() {
        var education = map(null, student()).getEducation();

        assertEquals(1, education.size());
        assertEquals("FPT University", education.getFirst().getUniversity());
        assertEquals("2023 - Present", education.getFirst().getPeriod());
        // Derived, not stored: nothing should mistake it for an editable row.
        assertTrue(education.getFirst().getEducationId() == null);
    }

    @Test
    void omitsTheEnrolmentEntryWhenTheUniversityIsUnknown() {
        Student withoutUniversity = student();
        withoutUniversity.setUniversityName(null);

        assertTrue(map(null, withoutUniversity).getEducation().isEmpty());
    }
}
