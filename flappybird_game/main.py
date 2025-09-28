import sys
import pygame
import random
from pygame.locals import *

# Constants
SCREEN_WIDTH = 400
SCREEN_HEIGHT = 600
FPS = 60
GRAVITY = 0.25
FLAP_STRENGTH = -6.5
PIPE_SPEED = 3
PIPE_GAP = 150
PIPE_FREQUENCY = 1500  # milliseconds

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Initialize pygame
pygame.init()
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption('Flappy Bird Clone')
clock = pygame.time.Clock()

import os
# Load assets (replace simple shapes with actual images)
# Bird image
bird_path = os.path.expanduser('~/.cache/goose/computer_controller/web_20250928_203030.bin')
# Note: the cached binary file is the PNG image; rename for clarity
bird_image = pygame.image.load(bird_path).convert_alpha()
BIRD_SIZE = bird_image.get_width()
bird_surface = pygame.transform.scale(bird_image, (BIRD_SIZE, BIRD_SIZE))

# Pipe image (simple green rectangle)
PIPE_WIDTH = 52
pipe_surface = pygame.Surface((PIPE_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
pipe_surface.fill((0, 200, 0))

# Background image
bg_path = os.path.expanduser('~/.cache/goose/computer_controller/web_20250928_203056.bin')
background_image = pygame.image.load(bg_path).convert()
background_image = pygame.transform.scale(background_image, (SCREEN_WIDTH, SCREEN_HEIGHT))

font = pygame.font.SysFont(None, 32)

class Bird:
    def __init__(self):
        self.x = SCREEN_WIDTH // 4
        self.y = SCREEN_HEIGHT // 2
        self.vel_y = 0
        self.alive = True
        self.rect = pygame.Rect(self.x, self.y, BIRD_SIZE, BIRD_SIZE)

    def update(self):
        self.vel_y += GRAVITY
        self.y += self.vel_y
        self.rect.topleft = (self.x, self.y)
        if self.y > SCREEN_HEIGHT - BIRD_SIZE or self.y < 0:
            self.alive = False

    def flap(self):
        self.vel_y = FLAP_STRENGTH

    def draw(self, surface):
        surface.blit(bird_surface, (self.x, self.y))

class PipePair:
    def __init__(self, x):
        self.x = x
        self.top_height = random.randint(50, SCREEN_HEIGHT - PIPE_GAP - 50)
        self.bottom_y = self.top_height + PIPE_GAP
        self.passed = False
        self.top_rect = pygame.Rect(self.x, 0, PIPE_WIDTH, self.top_height)
        self.bottom_rect = pygame.Rect(self.x, self.bottom_y, PIPE_WIDTH, SCREEN_HEIGHT - self.bottom_y)

    def update(self):
        self.x -= PIPE_SPEED
        self.top_rect.topleft = (self.x, 0)
        self.bottom_rect.topleft = (self.x, self.bottom_y)

    def draw(self, surface):
        # Draw top pipe as rectangle
        pygame.draw.rect(surface, (0, 200, 0), self.top_rect)
        # Draw bottom pipe as rectangle
        pygame.draw.rect(surface, (0, 200, 0), self.bottom_rect)

    def off_screen(self):
        return self.x < -PIPE_WIDTH

    def collides(self, bird_rect):
        return self.top_rect.colliderect(bird_rect) or self.bottom_rect.colliderect(bird_rect)

def main():
    bird = Bird()
    pipes = []
    score = 0
    pygame.time.set_timer(pygame.USEREVENT, PIPE_FREQUENCY)
    running = True
    while running:
        for event in pygame.event.get():
            if event.type == QUIT:
                running = False
            if event.type == KEYDOWN:
                if event.key == K_SPACE and bird.alive:
                    bird.flap()
                if event.key == K_r and not bird.alive:
                    bird = Bird()
                    pipes.clear()
                    score = 0
            if event.type == pygame.USEREVENT:
                pipes.append(PipePair(SCREEN_WIDTH))
        if bird.alive:
            bird.update()
            for pipe in pipes:
                pipe.update()
                if pipe.collides(bird.rect):
                    bird.alive = False
                if not pipe.passed and pipe.x + PIPE_WIDTH < bird.x:
                    pipe.passed = True
                    score += 1
            pipes = [p for p in pipes if not p.off_screen()]
        # Draw background image
        screen.blit(background_image, (0, 0))
        for pipe in pipes:
            pipe.draw(screen)
        bird.draw(screen)
        score_surf = font.render(f'Score: {score}', True, BLACK)
        screen.blit(score_surf, (10, 10))
        if not bird.alive:
            over_surf = font.render('Game Over! Press R to restart', True, (200, 0, 0))
            rect = over_surf.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2))
            screen.blit(over_surf, rect)
        pygame.display.flip()
        clock.tick(FPS)
    pygame.quit()
    sys.exit()

if __name__ == '__main__':
    main()
